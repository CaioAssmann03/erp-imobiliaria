"""Discounts: negative values in the launches, the boleto and the ledger (spec 055, R1–R7)."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.models import CostCenter, CurrentAccountEntry, EntryTemplate

from ..models import (
    BillingDocument,
    BillingEntry,
    BillingEntryUnit,
    BillingEvent,
    BillingRun,
    CondominiumBillingRules,
    GatewayAccount,
    GatewayEvent,
)
from ..services.create_billing_document import NewBillingDocumentItem, create_billing_document
from ..services.issue_condominium_billing import issue_condominium_billing
from ..services.process_gateway_event import process_gateway_event
from .test_gateway_webhook import make_event, received

pytestmark = pytest.mark.django_db

OCTOBER = date(2026, 10, 1)
Problem = BillingRun.ProblemCode


@pytest.fixture
def fee_event(company: Company) -> BillingEvent:
    return BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO", credits_company=True)


def launch(condominium: Condominium, cost_center: CostCenter | None, amount: str, **overrides: Any) -> BillingEntry:
    fields: dict[str, Any] = {
        "condominium": condominium,
        "description": "Desconto",
        "allocation": BillingEntry.Allocation.INDIVIDUAL,
        "recurrence": BillingEntry.Recurrence.ONCE,
        "start_month": OCTOBER,
        "cost_center": cost_center,
        "amount": Decimal(amount),
    }
    entry = BillingEntry(**{**fields, **overrides})
    entry.full_clean()
    entry.save()
    return entry


def select(entry: BillingEntry, *units: Any, amount: str | None = None) -> None:
    for unit in units:
        link = BillingEntryUnit(entry=entry, unit=unit, amount=Decimal(amount) if amount else None)
        link.full_clean()
        link.save()


# ----- R1, R2: the launch -----


def test_a_launch_may_be_a_discount_but_never_zero(
    condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    discount = launch(condominium, cost_center, "-50.00")

    assert discount.amount == Decimal("-50.00")
    with pytest.raises(ValidationError) as raised:
        launch(condominium, cost_center, "0.00")
    assert "amount.zero" in str(raised.value.error_dict["amount"][0].code)
    with pytest.raises(IntegrityError), transaction.atomic():
        BillingEntry.objects.filter(pk=discount.pk).update(amount=Decimal(0))


def test_the_fee_cannot_be_a_discount(condominium: Condominium, fee_event: BillingEvent) -> None:
    with pytest.raises(ValidationError) as raised:
        launch(condominium, None, "-3.90", event=fee_event)

    assert raised.value.error_dict["amount"][0].code == "billing_entry.amount.negative_for_company_event"


def test_a_units_own_value_has_the_sign_of_the_launch(  # type: ignore[no-untyped-def]
    condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate, make_unit
) -> None:
    unit = make_unit("101")
    discount = launch(condominium, cost_center, "-50.00")

    select(discount, unit, amount="-30.00")
    with pytest.raises(ValidationError) as raised:
        select(discount, make_unit("102"), amount="30.00")

    assert raised.value.error_dict["amount"][0].code == "billing_entry.unit.amount_sign_differs"
    assert discount.entry_units.get().amount == Decimal("-30.00")


# ----- R3: the allocation -----


def test_a_negative_total_is_split_and_adds_up(  # type: ignore[no-untyped-def]
    condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate, make_unit
) -> None:
    units = [make_unit(name) for name in ("101", "102", "103")]
    entry = launch(condominium, cost_center, "-100.00", allocation=BillingEntry.Allocation.COLLECTIVE)

    shares = entry.amounts_by_unit(units)

    assert sum(shares.values()) == Decimal("-100.00")
    assert sorted(shares.values()) == [Decimal("-33.34"), Decimal("-33.33"), Decimal("-33.33")]


# ----- R4: the document -----


def test_a_document_can_carry_a_discount_line(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("400.00")),
                NewBillingDocumentItem("Desconto", cost_center, entry_template, Decimal("-50.00")),
                NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
            )
        )
    )

    assert document.amount == Decimal("353.90")
    assert document.discountable_amount() == Decimal("350.00")


def test_the_total_cannot_fall_below_the_fee(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    items = (
        NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("100.00")),
        NewBillingDocumentItem("Desconto", cost_center, entry_template, Decimal("-102.00")),
        NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
    )

    with pytest.raises(ValidationError) as raised:
        create_billing_document(new_document(items=items))

    assert raised.value.error_dict["amount"][0].code == "billing_document.amount.below_fee"
    assert not BillingDocument.objects.exists()


def test_the_total_may_equal_the_fee(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    items = (
        NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("100.00")),
        NewBillingDocumentItem("Desconto", cost_center, entry_template, Decimal("-100.00")),
        NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
    )

    assert create_billing_document(new_document(items=items)).amount == Decimal("3.90")


def test_the_fee_line_is_never_negative_in_the_database(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("100.00")),
                NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
            )
        )
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        document.items.filter(credits_company=True).update(amount=Decimal("-3.90"))


# ----- R5: the issuance -----


def test_the_issuance_carries_the_discount_and_skips_the_unit_that_exceeds_the_total(  # type: ignore[no-untyped-def]
    condominium: Condominium,
    billing_rules: CondominiumBillingRules,
    cost_center: CostCenter,
    entry_template: EntryTemplate,
    make_unit,
    link,
    make_plan_item,
    fee_event: BillingEvent,
) -> None:
    ok, too_much = make_unit("101"), make_unit("102")
    link(ok, "Maria")
    link(too_much, "João")
    _ = make_plan_item()  # 450.00
    fee = launch(condominium, None, "3.90", event=fee_event, description="")
    select(fee, ok, too_much)
    discount = launch(condominium, cost_center, "-100.00")
    select(discount, ok)
    excessive = launch(condominium, cost_center, "-500.00", description="Desconto grande")
    select(excessive, too_much)

    run = issue_condominium_billing(condominium, OCTOBER)

    document = BillingDocument.objects.get()
    assert (document.unit, document.amount) == (ok, Decimal("353.90"))
    assert [item.amount for item in document.items.order_by("position")] == [Decimal("450.00"), Decimal("3.90"), Decimal("-100.00")]
    assert (run.issued_count, run.skipped_count) == (1, 1)
    assert (str(too_much.pk), Problem.DISCOUNT_EXCEEDS_TOTAL) in {(p["unit"], p["code"]) for p in run.problems}


# ----- R6: the payment -----


def test_paying_a_discounted_boleto_debits_the_discount_in_its_sub_conta(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    from ..models import BillingDocumentRegistration

    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("400.00")),
                NewBillingDocumentItem("Desconto", cost_center, entry_template, Decimal("-50.00")),
            )
        )
    )
    account = GatewayAccount.objects.create(
        company=document.unit.condominium.company, api_key="k", webhook_token="t", status=GatewayAccount.Status.ACTIVE
    )
    _ = BillingDocumentRegistration.objects.create(
        document=document, gateway_account=account, registered_due_date=document.due_date, gateway_payment_id="pay_1"
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()

    event = process_gateway_event(make_event(account, received(document)))

    assert event.outcome == GatewayEvent.Outcome.PROCESSED
    entries = {entry.amount: entry.kind for entry in CurrentAccountEntry.objects.all()}
    assert entries == {Decimal("400.00"): CurrentAccountEntry.Kind.CREDIT, Decimal("50.00"): CurrentAccountEntry.Kind.DEBIT}
    assert sum(entry.signed_amount for entry in CurrentAccountEntry.objects.all()) == document.amount


# ----- R7: the boleto text -----


def test_the_boleto_shows_a_discount_line_with_a_minus_sign(  # type: ignore[no-untyped-def]
    billing_rules: CondominiumBillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    from ..infrastructure.rendering.boleto_template import template_context

    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal("400.00")),
                NewBillingDocumentItem("Desconto", cost_center, entry_template, Decimal("-50.00")),
            )
        )
    )

    context = template_context(document)

    assert [item["amount"] for item in context["items"]] == ["R$ 400,00", "-R$ 50,00"]
    assert context["total"] == "R$ 350,00"
