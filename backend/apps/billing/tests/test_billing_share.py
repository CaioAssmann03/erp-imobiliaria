"""Line amounts and ideal-fraction shares of a plan item (spec 026, R2, R3)."""

from decimal import Decimal

import pytest

from ..models import BillingPlanItem

pytestmark = pytest.mark.django_db

Kind = BillingPlanItem.CalculationKind


def test_fixed_amount_is_the_same_for_every_unit(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    units = [make_unit("101"), make_unit("102")]

    amounts = make_plan_item().amounts_by_unit(units)

    assert amounts == {units[0].pk: Decimal("450.00"), units[1].pk: Decimal("450.00")}


def test_unit_registered_value_reads_the_units_own_value(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    with_gas = make_unit("101", gas_value=Decimal("35.50"))
    without = make_unit("102")
    item = make_plan_item(calculation_kind=Kind.UNIT_REGISTERED_VALUE, amount=None, unit_value_field="gas")

    amounts = item.amounts_by_unit([with_gas, without])

    assert amounts == {with_gas.pk: Decimal("35.50"), without.pk: Decimal("0.00")}


def test_share_is_the_total_times_the_fraction_rounded_to_the_cent(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    units = [make_unit("101", ideal_fraction=Decimal("0.25")), make_unit("102", ideal_fraction=Decimal("0.75"))]
    item = make_plan_item(calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("1000.01"), ideal_fraction_number=1)

    amounts = item.amounts_by_unit(units)

    assert amounts[units[0].pk] == Decimal("250.00")
    assert amounts[units[1].pk] == Decimal("750.01")


def test_the_shares_add_up_exactly_to_the_total(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    third = Decimal("0.33333333")
    units = [make_unit("101", ideal_fraction=third), make_unit("102", ideal_fraction=third), make_unit("103", ideal_fraction=Decimal("0.33333334"))]
    item = make_plan_item(calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("100.00"), ideal_fraction_number=1)

    amounts = item.amounts_by_unit(units)

    assert sum(amounts.values()) == Decimal("100.00")
    assert all(amount.as_tuple().exponent == -2 for amount in amounts.values())


def test_leftover_cents_go_to_the_largest_fraction(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    small = make_unit("101", ideal_fraction=Decimal("0.33333333"))
    large = make_unit("102", ideal_fraction=Decimal("0.66666667"))
    item = make_plan_item(calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("0.05"), ideal_fraction_number=1)

    amounts = item.amounts_by_unit([small, large])

    assert amounts == {small.pk: Decimal("0.02"), large.pk: Decimal("0.03")}


def test_a_unit_without_the_fraction_pays_no_share(make_plan_item, make_unit) -> None:  # type: ignore[no-untyped-def]
    has = make_unit("101", ideal_fraction=Decimal(1), ideal_fraction_2=Decimal(1))
    lacks = make_unit("102")
    item = make_plan_item(calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("90.00"), ideal_fraction_number=2)

    amounts = item.amounts_by_unit([has, lacks])

    assert amounts == {has.pk: Decimal("90.00"), lacks.pk: Decimal("0.00")}


@pytest.mark.parametrize(
    ("fraction_number", "totals", "is_inconsistent"),
    [
        (1, ["1", "0", "0", "0", "0", "0"], False),
        (1, ["0.9999", "0", "0", "0", "0", "0"], False),
        (1, ["0.9", "0", "0", "0", "0", "0"], True),
        (2, ["1", "0", "0", "0", "0", "0"], True),  # the 2nd fraction is named but no unit has it
    ],
)
def test_a_share_item_needs_its_fraction_to_close_at_one(  # type: ignore[no-untyped-def]
    make_plan_item, fraction_number: int, totals: list[str], is_inconsistent: bool
) -> None:
    item = make_plan_item(
        calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("90.00"), ideal_fraction_number=fraction_number
    )

    assert item.uses_inconsistent_apportionment([Decimal(total) for total in totals]) is is_inconsistent


def test_the_other_kinds_never_use_apportionment(make_plan_item) -> None:  # type: ignore[no-untyped-def]
    assert not make_plan_item().uses_inconsistent_apportionment([Decimal(0)] * 6)
