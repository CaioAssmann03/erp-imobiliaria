"""`condominium-people`: the persons list narrowed by `?condominium=` to the people with a current link to its units."""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from .base import errors, results

pytestmark = pytest.mark.django_db

URL = "condominium-person-list"


def link(unit: Unit, name: str, role: str = "tenant", **person_fields: object) -> Person:
    person = Person.objects.create(company=seeded_company(), name=name, **person_fields)
    extra = {"ownership_percentage": 100} if role == "owner" else {}
    _ = UnitPerson.objects.create(unit=unit, person=person, role=role, start_date=date(2025, 1, 1), **extra)
    return person


def names(response: object) -> list[str]:
    return [item["name"] for item in results(response)]  # type: ignore[arg-type]


@pytest.fixture
def other_condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Edifício Lua", cnpj="45723174000110")


def test_without_the_filter_it_is_the_persons_list(api_client: APIClient, condominium: Condominium) -> None:
    _ = link(Unit.objects.create(condominium=condominium, name="101"), "Maria")
    _ = Person.objects.create(company=seeded_company(), name="Sem vínculo")

    assert names(api_client.get(reverse(URL))) == ["Maria", "Sem vínculo"]


def test_the_condominium_filter_keeps_only_its_people_once_each_in_code_order(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    unit_a = Unit.objects.create(condominium=condominium, name="101")
    unit_b = Unit.objects.create(condominium=condominium, name="102")
    zeca = link(unit_a, "Zeca")  # created first: the lowest code
    _ = UnitPerson.objects.create(unit=unit_b, person=zeca, role="tenant", start_date=date(2025, 2, 1))  # two links, one person
    _ = link(unit_b, "Ana")
    _ = link(Unit.objects.create(condominium=other_condominium, name="201"), "Outra")

    response = api_client.get(reverse(URL), {"condominium": str(condominium.pk)})

    assert response.status_code == status.HTTP_200_OK
    assert names(response) == ["Zeca", "Ana"]


def test_an_ended_link_does_not_count(api_client: APIClient, condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    gone = link(unit, "Foi embora")
    UnitPerson.objects.filter(person=gone).update(end_date=timezone.localdate() - timedelta(days=1))
    _ = link(unit, "Mora aqui")

    assert names(api_client.get(reverse(URL), {"condominium": str(condominium.pk)})) == ["Mora aqui"]


def test_search_and_filters_still_work_inside_a_condominium(api_client: APIClient, condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    _ = link(unit, "Maria Souza")
    _ = link(unit, "João Silva", active=False)
    params = {"condominium": str(condominium.pk)}

    assert names(api_client.get(reverse(URL), {**params, "query": "maria"})) == ["Maria Souza"]
    assert names(api_client.get(reverse(URL), {**params, "active": "false"})) == ["João Silva"]


def test_a_bad_condominium_id_is_a_400(api_client: APIClient) -> None:
    response = api_client.get(reverse(URL), {"condominium": "not-a-uuid"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert [error["field"] for error in errors(response)] == ["condominium"]


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(URL)).status_code == status.HTTP_401_UNAUTHORIZED


def test_the_unit_filter_keeps_only_the_people_of_that_unit(api_client: APIClient, condominium: Condominium) -> None:
    unit_a = Unit.objects.create(condominium=condominium, name="101")
    unit_b = Unit.objects.create(condominium=condominium, name="102")
    _ = link(unit_a, "Mora na 101", "owner")
    _ = link(unit_b, "Mora na 102")

    assert names(api_client.get(reverse(URL), {"unit": str(unit_a.pk)})) == ["Mora na 101"]
    # Both filters together: the unit has to belong to that condominium.
    assert names(api_client.get(reverse(URL), {"unit": str(unit_b.pk), "condominium": str(condominium.pk)})) == ["Mora na 102"]


def test_a_unit_of_another_condominium_does_not_match_the_condominium_filter(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    foreign_unit = Unit.objects.create(condominium=other_condominium, name="201")
    _ = link(foreign_unit, "Outra")

    response = api_client.get(reverse(URL), {"unit": str(foreign_unit.pk), "condominium": str(condominium.pk)})

    assert names(response) == []


def test_a_bad_unit_id_is_a_400(api_client: APIClient) -> None:
    response = api_client.get(reverse(URL), {"unit": "nope"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert [error["field"] for error in errors(response)] == ["unit"]
