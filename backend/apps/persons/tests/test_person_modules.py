"""People by module (spec 038): one membership table per module, owned by the module's app."""

import re
from collections.abc import Callable
from pathlib import Path

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.condominiums.models import CondominiumPersonMember
from apps.core.testing import seeded_company
from apps.rentals.models import RentalPersonMember

from ..models import Person
from ..modules import registered_modules
from ..services.release_person_to_module import release_person_to_module
from .base import body, error_codes, results

pytestmark = pytest.mark.django_db

PERSONS_APP = Path(__file__).resolve().parents[1]
MODULE_APPS = ("condominiums", "rentals", "sales")


def make_person(name: str = "Maria", *modules: str) -> Person:
    person = Person.objects.create(company=seeded_company(), name=name)
    for module in modules:
        release_person_to_module(person, module)
    return person


def listed_names(response: Response) -> list[str]:
    return sorted(person["name"] for person in results(response))


def membership_url(person: Person, module: str) -> str:
    return reverse("person-module-membership", args=[person.pk, module])


def test_the_registered_modules_come_from_the_apps() -> None:
    assert registered_modules() == ["condominiums", "rentals"]


def test_persons_app_imports_no_module_app() -> None:
    """R2: adding a module never touches `persons`; the module's app registers itself."""
    pattern = re.compile(rf"\b(?:from|import)\s+apps\.({'|'.join(MODULE_APPS)})\b")
    offenders = [
        f"{source.relative_to(PERSONS_APP)}: {match.group(0)}"
        for source in PERSONS_APP.rglob("*.py")
        if "migrations" not in source.parts and "tests" not in source.parts
        for match in pattern.finditer(source.read_text())
    ]

    assert offenders == []


def test_a_person_is_born_in_no_module() -> None:
    person = make_person()

    assert not CondominiumPersonMember.objects.filter(person=person).exists()
    assert not RentalPersonMember.objects.filter(person=person).exists()


def test_the_payload_has_no_modules_field(api_client: APIClient, list_url: str) -> None:
    created = api_client.post(list_url, {"name": "Maria"}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    assert "modules" not in body(created)


def test_a_person_may_have_no_module(api_client: APIClient, list_url: str) -> None:
    created = api_client.post(list_url, {"name": "Maria"}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    assert listed_names(api_client.get(list_url)) == ["Maria"]
    assert listed_names(api_client.get(list_url, {"person_module": "condominiums"})) == []
    assert listed_names(api_client.get(list_url, {"person_module": "rentals"})) == []


def test_creating_with_a_module_releases_the_person(api_client: APIClient, list_url: str) -> None:
    created = api_client.post(f"{list_url}?person_module=rentals", {"name": "Maria"}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    assert RentalPersonMember.objects.filter(person_id=body(created)["id"]).exists()
    assert not CondominiumPersonMember.objects.filter(person_id=body(created)["id"]).exists()


def test_creating_with_an_unknown_module_creates_nothing(
    api_client: APIClient, list_url: str
) -> None:
    response = api_client.post(f"{list_url}?person_module=foo", {"name": "Maria"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "person_module") == ["invalid_choice"]
    assert not Person.objects.filter(name="Maria").exists()


def test_put_releases_and_delete_removes_a_module(api_client: APIClient) -> None:
    person = make_person("Maria")

    released = api_client.put(membership_url(person, "condominiums"))
    again = api_client.put(membership_url(person, "condominiums"))

    assert released.status_code == status.HTTP_204_NO_CONTENT
    assert again.status_code == status.HTTP_204_NO_CONTENT
    assert CondominiumPersonMember.objects.filter(person=person).count() == 1

    removed = api_client.delete(membership_url(person, "condominiums"))
    removed_again = api_client.delete(membership_url(person, "condominiums"))

    assert removed.status_code == status.HTTP_204_NO_CONTENT
    assert removed_again.status_code == status.HTTP_204_NO_CONTENT
    assert not CondominiumPersonMember.objects.filter(person=person).exists()


def test_a_person_can_be_in_both_modules_with_one_code(api_client: APIClient) -> None:
    """R8: one person, one `code`, two membership rows."""
    person = make_person("Maria")
    code_before = person.code

    _ = api_client.put(membership_url(person, "condominiums"))
    _ = api_client.put(membership_url(person, "rentals"))

    person.refresh_from_db()
    assert person.code == code_before
    assert CondominiumPersonMember.objects.filter(person=person).exists()
    assert RentalPersonMember.objects.filter(person=person).exists()


def test_an_unknown_module_in_the_path_is_a_400(api_client: APIClient) -> None:
    person = make_person("Maria")

    response = api_client.put(membership_url(person, "foo"))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "module") == ["invalid_choice"]


def test_a_person_of_another_company_is_not_found(
    api_client: APIClient, other_company_person: Person
) -> None:
    response = api_client.put(membership_url(other_company_person, "condominiums"))

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.fixture
def other_company_person(other_company: object) -> Person:
    return Person.objects.create(company=other_company, name="Alheia")  # type: ignore[misc]


def test_a_membership_is_unique_per_person() -> None:
    person = make_person("Maria", "condominiums")

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CondominiumPersonMember.objects.create(person=person)


def test_deleting_a_person_deletes_the_memberships() -> None:
    person = make_person("Maria", "condominiums", "rentals")

    _ = person.delete()

    assert CondominiumPersonMember.objects.count() == 0
    assert RentalPersonMember.objects.count() == 0


def test_module_filter_lists_only_that_module(api_client: APIClient, list_url: str) -> None:
    _ = make_person("Cond", "condominiums")
    _ = make_person("Loc", "rentals")
    _ = make_person("Ambas", "condominiums", "rentals")
    _ = make_person("Nenhuma")

    assert listed_names(api_client.get(list_url, {"person_module": "rentals"})) == ["Ambas", "Loc"]
    assert listed_names(api_client.get(list_url, {"person_module": "condominiums"})) == ["Ambas", "Cond"]
    assert listed_names(api_client.get(list_url)) == ["Ambas", "Cond", "Loc", "Nenhuma"]


def test_unknown_module_filter_is_a_400(api_client: APIClient, list_url: str) -> None:
    response = api_client.get(list_url, {"person_module": "foo"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_the_module_filter_does_not_query_per_person(api_client, list_url, django_assert_max_num_queries) -> None:  # type: ignore[no-untyped-def]
    for position in range(5):
        _ = make_person(f"Pessoa {position}", "condominiums", "rentals")

    with django_assert_max_num_queries(8):
        response = api_client.get(list_url, {"person_module": "condominiums"})

    assert len(results(response)) == 5
