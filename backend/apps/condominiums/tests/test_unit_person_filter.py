"""`?condominium=` on unit-people: every link of the units of one condominium, which is how a condominium lists its people."""

from datetime import date

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from .base import results

pytestmark = pytest.mark.django_db


def make_link(unit: Unit, person_name: str, role: str = "tenant") -> UnitPerson:
    person = Person.objects.create(company=seeded_company(), name=person_name)
    percentage = {"ownership_percentage": 100} if role == "owner" else {}
    return UnitPerson.objects.create(
        unit=unit, person=person, role=role, start_date=date(2025, 1, 1), **percentage
    )


def test_the_condominium_filter_lists_only_its_links(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    other = Condominium.objects.create(company=company, name="Edifício Lua", cnpj="45723174000110")
    _ = make_link(Unit.objects.create(condominium=condominium, name="101"), "Maria", "owner")
    _ = make_link(Unit.objects.create(condominium=condominium, name="102"), "João")
    _ = make_link(Unit.objects.create(condominium=other, name="201"), "Outra")

    response = api_client.get(reverse("unit-person-list"), {"condominium": str(condominium.pk)})

    assert response.status_code == status.HTTP_200_OK
    assert sorted(item["person_detail"]["name"] for item in results(response)) == ["João", "Maria"]


def test_without_the_filter_every_link_comes(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    other = Condominium.objects.create(company=company, name="Edifício Lua", cnpj="45723174000110")
    _ = make_link(Unit.objects.create(condominium=condominium, name="101"), "Maria")
    _ = make_link(Unit.objects.create(condominium=other, name="201"), "Outra")

    response = api_client.get(reverse("unit-person-list"))

    assert len(results(response)) == 2
