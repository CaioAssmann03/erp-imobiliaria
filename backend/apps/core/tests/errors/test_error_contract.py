"""Every API error is `{"errors": [{field, code, message}]}` (spec 006, R2, R3, R4, R6)."""

from typing import Any, cast

import pytest
from django.urls import reverse
from drf_spectacular.generators import SchemaGenerator
from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.test import APIClient

from apps.core.error_registry import all_error_codes
from apps.core.exception_handler import api_exception_handler, flatten_errors

from ..base import error_codes, errors
from ..scoping_data import build_company_data

pytestmark = pytest.mark.django_db

NEW_CNPJ = "45723174000110"


def is_flat_error_body(response_data: object) -> bool:
    return (
        isinstance(response_data, dict)
        and set(response_data) == {"errors"}
        and all(set(item) == {"field", "code", "message"} for item in response_data["errors"])
    )


# ----- R2: one shape for every error -----


def test_validation_error_is_a_flat_error_list(api_client: APIClient) -> None:
    response = api_client.post("/api/persons/", {"email": "nao-e-email"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert is_flat_error_body(response.data)
    assert error_codes(response, "name") == ["required"]
    assert error_codes(response, "email") == ["invalid"]


def test_401_has_the_same_shape() -> None:
    response = APIClient().get(reverse("person-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert is_flat_error_body(response.data)
    assert errors(response)[0]["field"] is None
    assert errors(response)[0]["code"] == "not_authenticated"


def test_403_has_the_same_shape(api_client: APIClient) -> None:
    response = api_client.post(
        reverse("company-list"), {"legal_name": "ACME", "cnpj": NEW_CNPJ}, format="json"
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert is_flat_error_body(response.data)
    assert errors(response)[0]["code"] == "permission_denied"


def test_404_has_the_same_shape(api_client: APIClient) -> None:
    response = api_client.get(
        reverse("person-detail", args=["00000000-0000-0000-0000-000000000000"])
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert is_flat_error_body(response.data)
    assert errors(response)[0]["code"] == "not_found"


def test_405_has_the_same_shape(api_client: APIClient) -> None:
    response = api_client.delete(reverse("person-list"))

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert is_flat_error_body(response.data)
    assert errors(response)[0]["code"] == "method_not_allowed"


def test_malformed_json_has_the_same_shape(api_client: APIClient) -> None:
    response = api_client.post(
        reverse("person-list"), data="{not json", content_type="application/json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "parse_error"


def test_login_failure_and_missing_token_codes(db: None) -> None:
    wrong_login = APIClient().post(
        reverse("token_obtain_pair"), {"username": "ninguem", "password": "x"}, format="json"
    )
    bad_token = APIClient()
    bad_token.credentials(HTTP_AUTHORIZATION="Bearer lixo")
    invalid_token = bad_token.get(reverse("person-list"))

    assert wrong_login.status_code == status.HTTP_401_UNAUTHORIZED
    assert is_flat_error_body(wrong_login.data)
    assert errors(wrong_login)[0]["code"] == "no_active_account"
    assert invalid_token.status_code == status.HTTP_401_UNAUTHORIZED
    assert is_flat_error_body(invalid_token.data)
    assert errors(invalid_token)[0]["code"] == "token_not_valid"


def test_status_codes_are_unchanged(api_client: APIClient) -> None:
    created = api_client.post("/api/persons/", {"name": "Maria"}, format="json")
    rejected = api_client.post("/api/persons/", {}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    assert rejected.status_code == status.HTTP_400_BAD_REQUEST


def test_500_is_not_reshaped() -> None:
    assert api_exception_handler(RuntimeError("boom"), {}) is None


# ----- R3: field paths -----


def test_nested_error_uses_dotted_path(api_client: APIClient, company) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        "/api/condominiums/",
        {"name": "X", "cnpj": NEW_CNPJ, "billing_rules": {"due_day": 31}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "billing_rules.due_day") == ["billing_rules.due_day.out_of_range"]


def test_list_position_is_a_number_in_the_path() -> None:
    tree = {"unit_people": [{}, {"person": [ErrorDetail("x", code="required")]}]}

    assert flatten_errors(tree) == [
        {"field": "unit_people.1.person", "code": "required", "message": "x"}
    ]


def test_non_field_error_has_null_field() -> None:
    tree = {"non_field_errors": [ErrorDetail("rule", code="some.rule")]}

    assert flatten_errors(tree) == [{"field": None, "code": "some.rule", "message": "rule"}]


def test_model_rule_codes_reach_the_api(api_client: APIClient, company) -> None:  # type: ignore[no-untyped-def]
    mine = build_company_data(company, seed=1)

    response = api_client.post(
        "/api/units/",
        {"condominium": str(mine.condominium.pk), "name": "9", "ideal_fraction": "0.5"},
        format="json",
    )
    too_much = api_client.post(
        "/api/units/",
        {"condominium": str(mine.condominium.pk), "name": "8", "ideal_fraction": "0.6"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert error_codes(too_much, "ideal_fraction") == ["unit.ideal_fraction.sum_exceeds_total"]


def test_django_validation_error_outside_a_serializer_is_a_400() -> None:
    from django.core.exceptions import ValidationError

    response = api_exception_handler(ValidationError("Not allowed.", code="some.rule"), {})

    assert response is not None
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {
        "errors": [{"field": None, "code": "some.rule", "message": "Not allowed."}]
    }


# ----- R4: generic codes are kept -----


def test_generic_codes_are_kept(api_client: APIClient) -> None:
    long_name = "x" * 300
    response = api_client.post(
        "/api/persons/", {"name": long_name, "email": "a@b.com", "active": "talvez"}, format="json"
    )

    assert error_codes(response, "name") == ["max_length"]
    assert error_codes(response, "active") == ["invalid"]
    blank = api_client.post("/api/persons/", {"name": ""}, format="json")
    assert error_codes(blank, "name") == ["blank"]
    null = api_client.post("/api/persons/", {"name": None}, format="json")
    assert error_codes(null, "name") == ["null"]


def test_every_code_answered_is_registered(api_client: APIClient, company) -> None:  # type: ignore[no-untyped-def]
    mine = build_company_data(company, seed=1)
    responses = [
        api_client.post("/api/persons/", {}, format="json"),
        api_client.post("/api/persons/", {"name": "x", "people_individual": {"cpf": "1"}}, format="json"),
        api_client.post("/api/units/", {"condominium": "nao-e-uuid", "name": "1"}, format="json"),
        api_client.post("/api/units/", {"condominium": str(mine.condominium.pk), "name": "1", "type": "castelo"}, format="json"),
        api_client.post("/api/condominiums/", {"name": "X", "cnpj": "123"}, format="json"),
        api_client.get(reverse("person-detail", args=["00000000-0000-0000-0000-000000000000"])),
    ]

    answered = {item["code"] for response in responses for item in errors(response)}

    assert answered <= set(all_error_codes())


# ----- R6: the schema -----


def schema() -> dict[str, Any]:
    generator = SchemaGenerator()  # type: ignore[no-untyped-call]
    return cast(dict[str, Any], generator.get_schema(request=None, public=True))  # type: ignore[no-untyped-call]


def test_schema_contains_error_response_and_error_code_enum() -> None:
    components = schema()["components"]["schemas"]

    assert components["ErrorCodeEnum"]["enum"] == all_error_codes()
    assert components["ErrorItem"]["properties"]["code"] == {"$ref": "#/components/schemas/ErrorCodeEnum"}
    assert components["ErrorResponse"]["properties"]["errors"]["type"] == "array"


def test_schema_attaches_the_error_responses_to_the_operations() -> None:
    paths = schema()["paths"]
    create_person = paths["/api/persons/"]["post"]["responses"]
    person_detail = paths["/api/persons/{id}/"]["get"]["responses"]

    assert {"400", "401", "403"} <= set(create_person)
    assert {"401", "403", "404"} <= set(person_detail)
    assert "400" not in person_detail
