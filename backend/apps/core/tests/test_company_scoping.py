"""Company isolation: every endpoint sees only the user's company (spec 004, R3, R4, R6)."""

from collections.abc import Iterator
from typing import Any

import pytest
from django.apps import apps as django_apps
from django.urls import reverse
from rest_framework import status, viewsets
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.core.scoping import CompanyScopedViewSetMixin, company_lookup_of

from .base import error_codes, errors, results
from .scoping_data import CompanyData, build_company_data

pytestmark = pytest.mark.django_db

# route basename -> attribute of CompanyData holding that resource
RESOURCES = {
    "person": "person",
    "condominium": "condominium",
    "block": "block",
    "unit": "unit",
    "unit-person": "unit_person",
}


@pytest.fixture
def mine(company: Company) -> CompanyData:
    return build_company_data(company, seed=1)


@pytest.fixture
def theirs(other_company: Company) -> CompanyData:
    return build_company_data(other_company, seed=2)


def ids(response_results: list[dict[str, object]]) -> set[str]:
    return {str(item["id"]) for item in response_results}


def app_models() -> Iterator[type]:
    for config in django_apps.get_app_configs():
        if config.name.startswith("apps."):
            yield from config.get_models()


def all_viewset_classes(root: type[Any] = viewsets.GenericViewSet) -> Iterator[type[Any]]:
    subclass: type[Any]
    for subclass in root.__subclasses__():
        yield subclass
        yield from all_viewset_classes(subclass)


# ----- R3: guards -----


def test_every_model_declares_company_lookup() -> None:
    missing = [model.__name__ for model in app_models() if not hasattr(model, "company_lookup")]

    assert missing == []


def test_every_company_lookup_resolves_to_a_company(company: Company) -> None:
    for model in app_models():
        lookup = company_lookup_of(model)
        _ = model._default_manager.filter(**{lookup: company.pk}).exists()  # type: ignore[attr-defined]


def test_every_viewset_uses_the_scope_mixin() -> None:
    import config.urls  # noqa: F401  (imports every app's views)

    unscoped = [
        viewset.__name__
        for viewset in all_viewset_classes()
        if viewset.__module__.startswith("apps.")
        and not issubclass(viewset, CompanyScopedViewSetMixin)
    ]

    assert unscoped == []


# ----- R4: isolation matrix -----


@pytest.mark.parametrize("basename", RESOURCES)
def test_list_is_limited_to_own_company(
    api_client: APIClient, mine: CompanyData, theirs: CompanyData, basename: str
) -> None:
    attribute = RESOURCES[basename]

    listed = ids(results(api_client.get(reverse(f"{basename}-list"))))

    assert str(getattr(mine, attribute).pk) in listed
    assert str(getattr(theirs, attribute).pk) not in listed


@pytest.mark.parametrize("basename", RESOURCES)
def test_other_company_record_is_404_on_retrieve_update_delete(
    api_client: APIClient, mine: CompanyData, theirs: CompanyData, basename: str
) -> None:
    url = reverse(f"{basename}-detail", args=[getattr(theirs, RESOURCES[basename]).pk])

    assert api_client.get(url).status_code == status.HTTP_404_NOT_FOUND
    assert api_client.patch(url, {}, format="json").status_code == status.HTTP_404_NOT_FOUND
    assert api_client.delete(url).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.parametrize("basename", RESOURCES)
def test_superuser_sees_all_companies(
    superuser_client: APIClient, mine: CompanyData, theirs: CompanyData, basename: str
) -> None:
    attribute = RESOURCES[basename]

    listed = ids(results(superuser_client.get(reverse(f"{basename}-list"))))

    assert {str(getattr(mine, attribute).pk), str(getattr(theirs, attribute).pk)} <= listed


def test_other_company_user_sees_only_their_own(
    other_api_client: APIClient, mine: CompanyData, theirs: CompanyData
) -> None:
    listed = ids(results(other_api_client.get(reverse("condominium-list"))))

    assert listed == {str(theirs.condominium.pk)}


# ----- R6: ids of another company -----


def test_foreign_condominium_id_on_a_unit_is_does_not_exist(
    api_client: APIClient, theirs: CompanyData
) -> None:
    response = api_client.post(
        reverse("unit-list"), {"condominium": str(theirs.condominium.pk), "name": "9"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "condominium") == ["does_not_exist"]


def test_foreign_advisor_is_does_not_exist(api_client: APIClient, theirs: CompanyData) -> None:
    response = api_client.post(
        reverse("condominium-list"),
        {"name": "X", "cnpj": "45723174000110", "advisor": str(theirs.person.pk)},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "advisor") == ["does_not_exist"]


def test_foreign_person_and_unit_on_a_link_are_does_not_exist(
    api_client: APIClient, mine: CompanyData, theirs: CompanyData
) -> None:
    payload = {
        "role": "tenant",
        "start_date": "2025-01-01",
    }

    foreign_person = api_client.post(
        reverse("unit-person-list"),
        {**payload, "unit": str(mine.unit.pk), "person": str(theirs.person.pk)},
        format="json",
    )
    foreign_unit = api_client.post(
        reverse("unit-person-list"),
        {**payload, "unit": str(theirs.unit.pk), "person": str(mine.person.pk)},
        format="json",
    )

    assert error_codes(foreign_person, "person") == ["does_not_exist"]
    assert error_codes(foreign_unit, "unit") == ["does_not_exist"]


def test_foreign_block_on_a_unit_is_does_not_exist(
    api_client: APIClient, mine: CompanyData, theirs: CompanyData
) -> None:
    response = api_client.post(
        reverse("unit-list"),
        {"condominium": str(mine.condominium.pk), "block": str(theirs.block.pk), "name": "7"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "block") == ["does_not_exist"]


def test_a_foreign_id_looks_like_a_missing_one(api_client: APIClient, theirs: CompanyData) -> None:
    foreign_id = str(theirs.condominium.pk)
    missing_id = "00000000-0000-0000-0000-000000000000"

    foreign = api_client.post(
        reverse("unit-list"), {"condominium": foreign_id, "name": "9"}, format="json"
    )
    missing = api_client.post(
        reverse("unit-list"), {"condominium": missing_id, "name": "9"}, format="json"
    )

    foreign_error = errors(foreign)[0]
    missing_error = errors(missing)[0]
    assert foreign_error["code"] == missing_error["code"] == "does_not_exist"
    assert str(foreign_error["message"]).replace(foreign_id, "ID") == str(
        missing_error["message"]
    ).replace(missing_id, "ID")
