"""Which units count as having a responsible person (the dashboard pendency)."""

from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.core.models import Company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from .base import add_fraction

pytestmark = pytest.mark.django_db

CNPJS = ["11222333000181", "45723174000110", "11444777000161"]


def make_condominium(company: Company, name: str, cnpj: str) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj)


def make_unit(condominium: Condominium, name: str, fraction: Decimal = Decimal(1), **fields: object) -> Unit:
    unit = Unit.objects.create(condominium=condominium, name=name, **fields)
    add_fraction(unit, fraction)
    return unit


TODAY = date(2026, 10, 23)


def link_owner(unit: Unit, company: Company, *, start_date: date, end_date: date | None = None) -> None:
    UnitPerson.objects.create(
        unit=unit,
        person=Person.objects.create(company=company, name=f"Dono {unit.name}"),
        role="owner",
        ownership_percentage=Decimal(100),
        start_date=start_date,
        end_date=end_date,
    )


def test_a_link_that_already_ended_does_not_count_as_responsible(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    unit = make_unit(condominium, "101")
    link_owner(unit, company, start_date=TODAY - timedelta(days=90), end_date=TODAY - timedelta(days=1))

    assert not Unit.objects.with_responsible(TODAY).exists()
    assert [u.name for u in Unit.objects.without_responsible(TODAY)] == ["101"]
