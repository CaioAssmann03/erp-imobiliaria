"""`unit-people`: the links searched by the person and narrowed to the current ones on the server (spec 064, R4)."""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from .base import results

pytestmark = pytest.mark.django_db

URL = "unit-person-list"


def link(unit: Unit, name: str, end_date: date | None = None) -> UnitPerson:
    person = Person.objects.create(company=seeded_company(), name=name)
    return UnitPerson.objects.create(unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1), end_date=end_date)


def names(response: object) -> list[str]:
    return sorted(row["person_detail"]["name"] for row in results(response))  # type: ignore[arg-type]


def test_query_searches_the_person(api_client: APIClient, condominium: Condominium) -> None:
    _ = link(Unit.objects.create(condominium=condominium, name="101"), "Maria Souza")
    _ = link(Unit.objects.create(condominium=condominium, name="102"), "João Lima")

    assert names(api_client.get(reverse(URL), {"condominium": str(condominium.pk), "query": "maria"})) == ["Maria Souza"]
    assert names(api_client.get(reverse(URL), {"condominium": str(condominium.pk), "query": "zzz"})) == []


def test_is_current_keeps_links_without_end_or_ending_today_or_later(api_client: APIClient, condominium: Condominium) -> None:
    today = timezone.localdate()
    _ = link(Unit.objects.create(condominium=condominium, name="101"), "Sem fim")
    _ = link(Unit.objects.create(condominium=condominium, name="102"), "Termina hoje", end_date=today)
    _ = link(Unit.objects.create(condominium=condominium, name="103"), "Terminou ontem", end_date=today - timedelta(days=1))
    scope = {"condominium": str(condominium.pk)}

    assert names(api_client.get(reverse(URL), {**scope, "is_current": "true"})) == ["Sem fim", "Termina hoje"]
    assert names(api_client.get(reverse(URL), {**scope, "is_current": "false"})) == ["Terminou ontem"]
