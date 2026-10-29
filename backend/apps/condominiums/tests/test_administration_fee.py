"""The administration fee of a contract: fixed, variable, floor, ceiling and rounding (spec 056, R2, R3)."""

from datetime import date
from decimal import Decimal

import pytest

from ..models import Condominium, CondominiumAdministrationContract

pytestmark = pytest.mark.django_db

Contract = CondominiumAdministrationContract


def variable(condominium: Condominium, percentage: str = "5.00", **overrides: object) -> Contract:
    fields = {"fee_type": Contract.FeeType.VARIABLE, "fee_percentage": Decimal(percentage), "fee_basis": Contract.FeeBasis.REVENUE}
    return Contract.objects.create(condominium=condominium, **{**fields, **overrides})


def test_a_fixed_fee_is_its_amount_whatever_the_base(condominium: Condominium) -> None:
    contract = Contract.objects.create(condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("1500.00"))

    assert contract.fee_for(Decimal("0")) == contract.fee_for(Decimal("99999.99")) == Decimal("1500.00")


def test_a_fixed_fee_ignores_the_floor_and_the_ceiling(condominium: Condominium) -> None:
    contract = Contract.objects.create(
        condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("100.00"), fee_floor=Decimal("200.00")
    )

    assert contract.fee_for(Decimal("0")) == Decimal("100.00")


def test_a_variable_fee_is_a_percentage_of_the_base_rounded_half_up(condominium: Condominium) -> None:
    contract = variable(condominium, "2.50")

    assert contract.fee_for(Decimal("1000.00")) == Decimal("25.00")
    assert contract.fee_for(Decimal("0.10")) == Decimal("0.00")
    assert contract.fee_for(Decimal("0.20")) == Decimal("0.01")  # 0.005 rounds up


def test_the_floor_and_the_ceiling_bound_a_variable_fee(condominium: Condominium) -> None:
    contract = variable(condominium, "10.00", fee_floor=Decimal("300.00"), fee_ceiling=Decimal("800.00"))

    assert contract.fee_before_limits(Decimal("1000.00")) == Decimal("100.00")
    assert contract.fee_for(Decimal("1000.00")) == Decimal("300.00")
    assert contract.fee_for(Decimal("5000.00")) == Decimal("500.00")
    assert contract.fee_for(Decimal("20000.00")) == Decimal("800.00")


def test_a_month_before_the_start_date_is_not_due(condominium: Condominium) -> None:
    contract = variable(condominium, start_date=date(2026, 10, 15))

    assert not contract.is_due_in(date(2026, 9, 1))
    assert contract.is_due_in(date(2026, 10, 1))  # the month of the start date already counts
    assert contract.is_due_in(date(2026, 11, 1))


def test_a_contract_without_a_start_date_is_always_due(condominium: Condominium) -> None:
    assert variable(condominium).is_due_in(date(2000, 1, 1))
