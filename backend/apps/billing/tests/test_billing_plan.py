"""Billing plans: months, uniqueness, fixed condominium and the plans in force (spec 024, R1, R6)."""

from datetime import date

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import Condominium

from ..models import BillingPlan

pytestmark = pytest.mark.django_db


def error_codes(error: ValidationError, field: str) -> list[str | None]:
    return [single_error.code for single_error in error.error_dict[field]]


def test_months_are_written_as_their_first_day(condominium: Condominium) -> None:
    plan = BillingPlan(condominium=condominium, name="Obra", start_month=date(2026, 3, 15))

    with pytest.raises(ValidationError) as raised:
        plan.full_clean()

    assert error_codes(raised.value, "start_month") == ["month.not_first_day"]


def test_end_month_before_start_month_is_rejected(condominium: Condominium) -> None:
    plan = BillingPlan(
        condominium=condominium, name="Obra", start_month=date(2026, 12, 1), end_month=date(2026, 3, 1)
    )

    with pytest.raises(ValidationError) as raised:
        plan.full_clean()

    assert error_codes(raised.value, "end_month") == ["billing_plan.end_month.before_start_month"]


def test_end_month_before_start_month_is_refused_by_the_database(condominium: Condominium) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BillingPlan.objects.create(
            condominium=condominium, name="Obra", start_month=date(2026, 12, 1), end_month=date(2026, 3, 1)
        )


def test_name_is_unique_per_condominium(condominium: Condominium, other_condominium: Condominium) -> None:
    _ = BillingPlan.objects.create(condominium=condominium, name="Ordinária")
    _ = BillingPlan.objects.create(condominium=other_condominium, name="Ordinária")

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BillingPlan.objects.create(condominium=condominium, name="Ordinária")


def test_condominium_cannot_change(plan: BillingPlan, other_condominium: Condominium) -> None:
    plan.condominium = other_condominium

    with pytest.raises(ValidationError) as raised:
        plan.full_clean()

    assert error_codes(raised.value, "condominium") == ["billing_plan.condominium.immutable"]


def test_in_force_follows_active_and_the_months(condominium: Condominium) -> None:
    always = BillingPlan.objects.create(condominium=condominium, name="Ordinária")
    works = BillingPlan.objects.create(
        condominium=condominium, name="Obra", start_month=date(2026, 3, 1), end_month=date(2026, 12, 1)
    )
    _ = BillingPlan.objects.create(condominium=condominium, name="Desligado", active=False)
    from_april = BillingPlan.objects.create(condominium=condominium, name="Fundo", start_month=date(2026, 4, 1))

    def names_in_force(reference_month: date) -> set[str]:
        return set(BillingPlan.objects.in_force(reference_month).values_list("name", flat=True))

    assert names_in_force(date(2026, 2, 1)) == {always.name}
    assert names_in_force(date(2026, 3, 20)) == {always.name, works.name}
    assert names_in_force(date(2026, 12, 1)) == {always.name, works.name, from_april.name}
    assert names_in_force(date(2027, 1, 1)) == {always.name, from_april.name}
