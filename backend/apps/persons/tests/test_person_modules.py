"""People by module (spec 019, R7, R8, R10): condominium people and rental people stay apart."""

from collections.abc import Callable
from uuid import uuid4

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import Person
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db


def make_person(name: str = "Maria", **fields: object) -> Person:
    return Person.objects.create(company=seeded_company(), name=name, **fields)


def listed_names(response: Response) -> list[str]:
    return sorted(person["name"] for person in results(response))


def test_default_modules() -> None:
    assert make_person().modules == ["condominiums"]


def test_the_database_defaults_modules_for_writers_that_do_not_know_the_field() -> None:
    """An old container during a deploy, or plain SQL, inserts a person without `modules`."""
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO persons_person (id, created_at, updated_at, name, email, active, company_id)"
            " VALUES (%s, now(), now(), 'SQL', '', true, %s) RETURNING modules",
            [uuid4(), seeded_company().pk],
        )
        row = cursor.fetchone()

    assert row == (["condominiums"],)


def test_default_modules_through_the_api(api_client: APIClient, list_url: str) -> None:
    created = api_client.post(list_url, {"name": "Maria"}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    assert body(created)["modules"] == ["condominiums"]


def test_empty_modules_fail_the_rule() -> None:
    person = Person(company=seeded_company(), name="Maria", modules=[])

    with pytest.raises(ValidationError) as exc:
        person.full_clean()

    assert [error.code for error in exc.value.error_dict["modules"]] == ["person.modules.empty"]


@pytest.mark.parametrize("modules", [[], ["foo"], ["condominiums", "foo"]])
def test_database_refuses_empty_and_unknown_modules(modules: list[str]) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_person("Maria", modules=modules)


def test_api_writes_and_reads_modules(
    api_client: APIClient, list_url: str, detail_url: Callable[[Person], str]
) -> None:
    created = api_client.post(list_url, {"name": "Maria", "modules": ["rentals"]}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    person = Person.objects.get(pk=body(created)["id"])
    assert person.modules == ["rentals"]

    patched = api_client.patch(
        detail_url(person), {"modules": ["condominiums", "rentals"]}, format="json"
    )

    assert body(patched)["modules"] == ["condominiums", "rentals"]
    person.refresh_from_db()
    assert person.modules == ["condominiums", "rentals"]


def test_api_refuses_empty_and_unknown_modules(api_client: APIClient, list_url: str) -> None:
    empty = api_client.post(list_url, {"name": "Maria", "modules": []}, format="json")
    unknown = api_client.post(list_url, {"name": "Maria", "modules": ["foo"]}, format="json")

    assert empty.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(empty, "modules") == ["person.modules.empty"]
    assert unknown.status_code == status.HTTP_400_BAD_REQUEST
    assert "invalid_choice" in [item["code"] for item in errors(unknown)]


def test_a_patch_cannot_empty_the_modules(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_person("Maria")

    response = api_client.patch(detail_url(person), {"modules": []}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "modules") == ["person.modules.empty"]
    person.refresh_from_db()
    assert person.modules == ["condominiums"]


def test_module_filter_lists_only_that_module(api_client: APIClient, list_url: str) -> None:
    _ = make_person("Cond", modules=["condominiums"])
    _ = make_person("Loc", modules=["rentals"])
    _ = make_person("Ambas", modules=["condominiums", "rentals"])

    assert listed_names(api_client.get(list_url, {"module": "rentals"})) == ["Ambas", "Loc"]
    assert listed_names(api_client.get(list_url, {"module": "condominiums"})) == ["Ambas", "Cond"]
    assert listed_names(api_client.get(list_url)) == ["Ambas", "Cond", "Loc"]


def test_unknown_module_filter_is_a_400(api_client: APIClient, list_url: str) -> None:
    response = api_client.get(list_url, {"module": "foo"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_releasing_to_rentals_keeps_the_code(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_person("Maria")
    code_before = person.code

    response = api_client.patch(
        detail_url(person), {"modules": ["condominiums", "rentals"]}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["code"] == code_before
    person.refresh_from_db()
    assert person.code == code_before
