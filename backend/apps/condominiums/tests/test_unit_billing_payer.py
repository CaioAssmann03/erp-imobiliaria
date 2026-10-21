"""Who pays a unit's boleto (spec 026)."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.models import Company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson

pytestmark = pytest.mark.django_db

TODAY = date(2026, 10, 21)


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101")


def link(company: Company, unit: Unit, name: str, role: str, percentage: str | None = None, **dates: date | None) -> Person:
    person = Person.objects.create(company=company, name=name)
    _ = UnitPerson.objects.create(
        unit=unit,
        person=person,
        role=role,
        ownership_percentage=Decimal(percentage) if percentage else None,
        start_date=dates.get("start_date") or date(2020, 1, 1),
        end_date=dates.get("end_date"),
    )
    return person


def payer(unit: Unit) -> Person | None:
    return Unit.objects.get(pk=unit.pk).billing_payer(TODAY)


def test_the_default_recipient_is_the_owner(company: Company, unit: Unit) -> None:
    owner = link(company, unit, "Dono", "owner", "100")
    _ = link(company, unit, "Inquilino", "tenant")

    assert unit.billing_recipient == Unit.BillingRecipient.OWNER
    assert payer(unit) == owner


def test_a_tenant_recipient_pays_when_there_is_a_current_tenant(company: Company, unit: Unit) -> None:
    _ = link(company, unit, "Dono", "owner", "100")
    tenant = link(company, unit, "Inquilino", "tenant")
    _ = Unit.objects.filter(pk=unit.pk).update(billing_recipient=Unit.BillingRecipient.TENANT)

    assert payer(unit) == tenant


def test_a_tenant_recipient_without_a_current_tenant_falls_back_to_the_owner(company: Company, unit: Unit) -> None:
    owner = link(company, unit, "Dono", "owner", "100")
    _ = link(company, unit, "Ex-inquilino", "tenant", end_date=date(2026, 1, 1))
    _ = Unit.objects.filter(pk=unit.pk).update(billing_recipient=Unit.BillingRecipient.TENANT)

    assert payer(unit) == owner


def test_the_owner_with_the_largest_share_pays(company: Company, unit: Unit) -> None:
    _ = link(company, unit, "Pequeno", "owner", "30")
    large = link(company, unit, "Grande", "owner", "70")

    assert payer(unit) == large


def test_a_tie_goes_to_the_earliest_link(company: Company, unit: Unit) -> None:
    older = link(company, unit, "Antigo", "owner", "50", start_date=date(2019, 1, 1))
    _ = link(company, unit, "Novo", "owner", "50", start_date=date(2021, 1, 1))

    assert payer(unit) == older


def test_an_ended_owner_does_not_pay_and_no_owner_means_no_payer(company: Company, unit: Unit) -> None:
    _ = link(company, unit, "Ex-dono", "owner", "100", end_date=date(2026, 1, 1))

    assert payer(unit) is None
