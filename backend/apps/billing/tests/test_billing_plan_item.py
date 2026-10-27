"""Billing plan items: the fields of each calculation kind and the accounting links (spec 024, R2, R3)."""

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import Condominium
from apps.finance.models import CostCenter, EntryTemplate

from ..models import BillingPlanItem

pytestmark = pytest.mark.django_db

Kind = BillingPlanItem.CalculationKind


def error_codes(item: BillingPlanItem, field: str) -> list[str | None]:
    with pytest.raises(ValidationError) as raised:
        item.full_clean()
    return [single_error.code for single_error in raised.value.error_dict.get(field, [])]


# ----- R2: the fields of each kind -----


def test_each_kind_with_its_own_fields_is_valid(build_item) -> None:  # type: ignore[no-untyped-def]
    build_item().full_clean()
    build_item(calculation_kind=Kind.IDEAL_FRACTION_SHARE, amount=Decimal("9000.00"), ideal_fraction_number=2).full_clean()
    build_item(
        calculation_kind=Kind.UNIT_REGISTERED_VALUE, amount=None, unit_value_field=BillingPlanItem.UnitValueField.GAS
    ).full_clean()


@pytest.mark.parametrize(
    ("overrides", "field", "code"),
    [
        ({"amount": None}, "amount", "billing_plan_item.amount.does_not_match_kind"),
        ({"ideal_fraction_number": 1}, "ideal_fraction_number", "billing_plan_item.ideal_fraction_number.does_not_match_kind"),
        ({"unit_value_field": "water"}, "unit_value_field", "billing_plan_item.unit_value_field.does_not_match_kind"),
        (
            {"calculation_kind": Kind.IDEAL_FRACTION_SHARE},
            "ideal_fraction_number",
            "billing_plan_item.ideal_fraction_number.does_not_match_kind",
        ),
        (
            {"calculation_kind": Kind.UNIT_REGISTERED_VALUE, "unit_value_field": "water"},
            "amount",
            "billing_plan_item.amount.does_not_match_kind",
        ),
        (
            {"calculation_kind": Kind.UNIT_REGISTERED_VALUE, "amount": None},
            "unit_value_field",
            "billing_plan_item.unit_value_field.does_not_match_kind",
        ),
        ({"amount": Decimal(0)}, "amount", "amount.not_positive"),
        (
            {"calculation_kind": Kind.IDEAL_FRACTION_SHARE, "ideal_fraction_number": 7},
            "ideal_fraction_number",
            "ideal_fraction_number.out_of_range",
        ),
    ],
)
def test_fields_that_do_not_match_the_kind_are_rejected(build_item, overrides, field, code) -> None:  # type: ignore[no-untyped-def]
    assert code in error_codes(build_item(**overrides), field)


@pytest.mark.parametrize(
    "overrides",
    [
        {"amount": None},
        {"ideal_fraction_number": 1},
        {"calculation_kind": Kind.IDEAL_FRACTION_SHARE},
        {"calculation_kind": Kind.UNIT_REGISTERED_VALUE, "unit_value_field": "gas"},
        {"calculation_kind": Kind.UNIT_REGISTERED_VALUE, "amount": None},
        {"amount": Decimal(-1)},
        {"calculation_kind": Kind.IDEAL_FRACTION_SHARE, "ideal_fraction_number": 0},
    ],
)
def test_fields_that_do_not_match_the_kind_are_refused_by_the_database(build_item, overrides) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        build_item(**overrides).save()


def test_position_is_unique_per_plan(build_item) -> None:  # type: ignore[no-untyped-def]
    build_item().save()

    with pytest.raises(IntegrityError), transaction.atomic():
        build_item(description="Outra").save()


# ----- R3: cost center and entry template -----


def test_cost_center_of_another_condominium_is_rejected(build_item, other_condominium: Condominium) -> None:  # type: ignore[no-untyped-def]
    foreign_cost_center = CostCenter.objects.create(condominium=other_condominium, name="Taxa Ordinária")
    foreign_template = EntryTemplate.objects.create(cost_center=foreign_cost_center, name="REC")

    item = build_item(cost_center=foreign_cost_center, entry_template=foreign_template)

    assert error_codes(item, "cost_center") == ["billing_plan_item.cost_center.other_condominium"]


def test_inactive_cost_center_and_entry_template_are_rejected(build_item, cost_center: CostCenter, entry_template: EntryTemplate) -> None:  # type: ignore[no-untyped-def]
    cost_center.active = False
    entry_template.active = False

    item = build_item()

    assert error_codes(item, "cost_center") == ["billing_plan_item.cost_center.inactive"]
    assert error_codes(item, "entry_template") == ["billing_plan_item.entry_template.inactive"]


def test_entry_template_of_another_cost_center_is_rejected(build_item, condominium: Condominium) -> None:  # type: ignore[no-untyped-def]
    reserve_fund = CostCenter.objects.create(condominium=condominium, name="Fundo de Reserva")
    reserve_template = EntryTemplate.objects.create(cost_center=reserve_fund, name="REC Fundo")

    item = build_item(entry_template=reserve_template)

    assert error_codes(item, "entry_template") == ["billing_plan_item.entry_template.other_cost_center"]


# ----- spec 038/039: an item may name an event, and the boleto line opens with its code -----


def test_an_item_with_an_event_prints_the_code_and_the_name(  # type: ignore[no-untyped-def]
    make_plan_item, company
) -> None:
    from ..models import BillingEvent

    event = BillingEvent.objects.create(company=company, code=52, name="CONDOMINIO")
    only_event = make_plan_item(event=event, description="")
    both = make_plan_item(position=2, event=event, description="10/2026")
    plain = make_plan_item(position=3, description="Taxa condominial")

    assert only_event.line_description() == "0052-CONDOMINIO"
    assert both.line_description() == "0052-CONDOMINIO - 10/2026"
    assert plain.line_description() == "Taxa condominial"


def test_an_item_needs_an_event_or_a_description_and_never_the_administradora_event(  # type: ignore[no-untyped-def]
    plan, cost_center, entry_template, company, other_company
) -> None:
    import pytest
    from django.core.exceptions import ValidationError

    from ..models import BillingEvent, BillingPlanItem

    def build(**overrides: object) -> BillingPlanItem:
        fields: dict[str, object] = {
            "plan": plan,
            "position": 1,
            "description": "",
            "cost_center": cost_center,
            "entry_template": entry_template,
            "calculation_kind": "fixed_amount",
            "amount": 10,
        }
        return BillingPlanItem(**{**fields, **overrides})

    fee = BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO", credits_company=True)
    foreign = BillingEvent.objects.create(company=other_company, code=1, name="ALHEIO")

    for overrides, field in (({}, "description"), ({"event": fee}, "event"), ({"event": foreign}, "event")):
        with pytest.raises(ValidationError) as raised:
            build(**overrides).full_clean()
        assert field in raised.value.error_dict, overrides
