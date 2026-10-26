"""CondominiumQuerySet.with_inconsistent_apportionment and UnitQuerySet.billing_blocked (the dashboard's pendencies)."""

from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.core.models import Company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from ..testing import add_fraction

pytestmark = pytest.mark.django_db

CNPJS = ["11222333000181", "45723174000110", "11444777000161"]


def make_condominium(company: Company, name: str, cnpj: str) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj)


def make_unit(condominium: Condominium, name: str, fraction: Decimal = Decimal(1), **fields: object) -> Unit:
    unit = Unit.objects.create(condominium=condominium, name=name, **fields)
    add_fraction(unit, fraction)
    return unit


def test_with_inconsistent_apportionment_keeps_only_the_condominiums_whose_fractions_do_not_close(
    company: Company,
) -> None:
    closed = make_condominium(company, "Fecha", CNPJS[0])
    make_unit(closed, "101")
    open_sum = make_condominium(company, "Nao fecha", CNPJS[1])
    make_unit(open_sum, "101", fraction=Decimal("0.5"))

    names = [condominium.name for condominium in Condominium.objects.with_inconsistent_apportionment()]

    assert names == ["Nao fecha"]


def test_with_inconsistent_apportionment_can_be_chained_on_a_filtered_queryset(company: Company) -> None:
    open_sum = make_condominium(company, "Nao fecha", CNPJS[0])
    make_unit(open_sum, "101", fraction=Decimal("0.5"))
    other = make_condominium(company, "Outro", CNPJS[1])
    make_unit(other, "101", fraction=Decimal("0.5"))

    queryset = Condominium.objects.filter(name="Outro").with_inconsistent_apportionment()

    assert [condominium.name for condominium in queryset] == ["Outro"]


def test_billing_blocked_keeps_only_active_blocked_units(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    make_unit(condominium, "Bloqueada", is_billing_blocked=True)
    make_unit(condominium, "Livre")
    make_unit(condominium, "Inativa bloqueada", is_billing_blocked=True, active=False)

    assert [unit.name for unit in Unit.objects.billing_blocked()] == ["Bloqueada"]


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


def test_with_and_without_responsible_split_the_active_units(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    with_owner = make_unit(condominium, "101")
    make_unit(condominium, "102")
    make_unit(condominium, "103", active=False)
    link_owner(with_owner, company, start_date=TODAY - timedelta(days=30))

    assert [unit.name for unit in Unit.objects.with_responsible(TODAY)] == ["101"]
    assert [unit.name for unit in Unit.objects.without_responsible(TODAY)] == ["102"]


def test_a_link_that_already_ended_does_not_count_as_responsible(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    unit = make_unit(condominium, "101")
    link_owner(unit, company, start_date=TODAY - timedelta(days=90), end_date=TODAY - timedelta(days=1))

    assert not Unit.objects.with_responsible(TODAY).exists()
    assert [u.name for u in Unit.objects.without_responsible(TODAY)] == ["101"]


def test_condominium_totals_and_count_by_type(company: Company) -> None:
    Condominium.objects.create(company=company, name="A", cnpj=CNPJS[0], type="residential")
    Condominium.objects.create(company=company, name="B", cnpj=CNPJS[1], type="residential", active=False)
    Condominium.objects.create(company=company, name="C", cnpj=CNPJS[2], type="commercial")

    assert Condominium.objects.totals() == {"total": 3, "active": 2}
    assert Condominium.objects.count_by_type() == {"residential": 2, "commercial": 1}


def test_unit_totals_and_count_by_type(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    make_unit(condominium, "101", type="apartment")
    make_unit(condominium, "102", type="apartment", active=False)
    make_unit(condominium, "S1", type="store")

    assert Unit.objects.totals() == {"total": 3, "active": 2}
    assert Unit.objects.count_by_type() == {"apartment": 2, "store": 1}


def test_counts_of_an_empty_queryset_are_zero_and_empty() -> None:
    assert Unit.objects.none().totals() == {"total": 0, "active": 0}
    assert Unit.objects.none().count_by_type() == {}


def test_active_leaves_out_inactive_units(company: Company) -> None:
    condominium = make_condominium(company, "Residencial", CNPJS[0])
    make_unit(condominium, "101")
    make_unit(condominium, "102", active=False)

    assert [unit.name for unit in Unit.objects.active()] == ["101"]
