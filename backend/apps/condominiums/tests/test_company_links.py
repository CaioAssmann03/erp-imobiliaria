"""Linked records share a company (spec 004, R5, R7)."""

from datetime import date

import pytest
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.core.testing import seeded_company
from apps.persons.models import Person
from apps.persons.services.release_person_to_module import release_person_to_module

from ..models import Condominium, Unit, UnitPerson
from .base import body

pytestmark = pytest.mark.django_db


@pytest.fixture
def foreign_person(other_company: Company) -> Person:
    return Person.objects.create(company=other_company, name="De outra empresa")


def test_advisor_must_share_the_company(
    condominium: Condominium, foreign_person: Person
) -> None:
    condominium.advisor = foreign_person

    with pytest.raises(ValidationError) as error:
        condominium.clean()

    assert "advisor" in error.value.message_dict


def test_advisor_of_the_same_company_is_accepted(condominium: Condominium) -> None:
    condominium.advisor = Person.objects.create(company=seeded_company(), name="Assessora")

    condominium.clean()


def test_unit_person_must_share_the_company(
    condominium: Condominium, foreign_person: Person
) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    link = UnitPerson(unit=unit, person=foreign_person, role="tenant", start_date=date(2025, 1, 1))

    with pytest.raises(ValidationError) as error:
        link.clean()

    assert "person" in error.value.message_dict


def test_unit_person_of_the_same_company_is_accepted(condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    person = Person.objects.create(company=seeded_company(), name="Inquilino")
    release_person_to_module(person, "condominiums")

    UnitPerson(unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)).clean()


def test_create_takes_the_company_from_the_user(api_client: APIClient, company: Company) -> None:
    response = api_client.post(
        "/api/condominiums/", {"name": "Novo", "cnpj": "45723174000110"}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert Condominium.objects.get(pk=body(response)["id"]).company == company


def test_company_in_the_body_is_ignored(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    response = api_client.post(
        "/api/condominiums/",
        {"name": "Novo", "cnpj": "45723174000110", "company": str(other_company.pk)},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Condominium.objects.get(pk=body(response)["id"]).company == company


def test_patch_cannot_move_a_condominium_to_another_company(
    api_client: APIClient, condominium: Condominium, company: Company, other_company: Company
) -> None:
    response = api_client.patch(
        f"/api/condominiums/{condominium.pk}/", {"company": str(other_company.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    condominium.refresh_from_db()
    assert condominium.company == company
