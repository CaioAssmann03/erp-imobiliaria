"""The registration fee: an event that credits the administradora, never a condominium (spec 038)."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import BillingRules, Condominium, Unit
from apps.core.models import Company
from apps.finance.models import CompanyEntry, CostCenter, CurrentAccount, CurrentAccountEntry, EntryTemplate

from ..gateway.charges import _charge_payload
from ..models import (
    BillingDocument,
    BillingDocumentItem,
    BillingEntry,
    BillingEntryUnit,
    BillingEvent,
    BillingRun,
    GatewayAccount,
    GatewayEvent,
)
from ..services.create_billing_document import NewBillingDocumentItem, create_billing_document
from ..services.issue_condominium_billing import issue_condominium_billing
from ..services.process_gateway_event import process_gateway_event
from .test_gateway_webhook import make_event, received

pytestmark = pytest.mark.django_db

OCTOBER = date(2026, 10, 1)


@pytest.fixture
def fee_event(company: Company) -> BillingEvent:
    return BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO", credits_company=True)


def fee_entry(condominium: Condominium, event: BillingEvent, **overrides: Any) -> BillingEntry:
    fields = {
        "condominium": condominium,
        "event": event,
        "allocation": BillingEntry.Allocation.INDIVIDUAL,
        "recurrence": BillingEntry.Recurrence.ALWAYS,
        "start_month": OCTOBER,
        "amount": Decimal("3.90"),
    }
    entry = BillingEntry(**{**fields, **overrides})
    entry.full_clean()
    entry.save()
    return entry


# ----- the launch -----


def test_a_company_event_has_no_sub_conta(condominium: Condominium, fee_event: BillingEvent, cost_center: CostCenter, entry_template: EntryTemplate) -> None:
    entry = fee_entry(condominium, fee_event)

    assert entry.cost_center is None and entry.entry_template is None and entry.credits_company
    with pytest.raises(ValidationError) as raised:
        fee_entry(condominium, fee_event, cost_center=cost_center)
    assert "never goes to a condominium" in raised.value.error_dict["cost_center"][0].messages[0]


def test_any_other_event_needs_its_sub_conta(condominium: Condominium, company: Company) -> None:
    ordinary = BillingEvent.objects.create(company=company, code=52, name="CONDOMINIO")

    with pytest.raises(ValidationError) as raised:
        fee_entry(condominium, ordinary)

    assert "Choose the sub-conta" in raised.value.error_dict["cost_center"][0].messages[0]


def test_the_line_opens_with_the_code_and_the_name(fee_event: BillingEvent) -> None:
    assert fee_event.line_label == "0005-TARIFA BANCO"


# ----- the document -----


def test_a_line_that_credits_the_company_has_no_cost_center_and_the_others_have_both(  # type: ignore[no-untyped-def]
    billing_rules: BillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
                NewBillingDocumentItem("0052-CONDOMINIO", cost_center, entry_template, Decimal("170.00")),
            )
        )
    )

    fee, condominium_line = document.items.order_by("position")
    assert (fee.credits_company, fee.cost_center) == (True, None)
    assert (condominium_line.credits_company, condominium_line.cost_center) == (False, cost_center)
    assert (document.amount, document.fee_amount(), document.discountable_amount()) == (
        Decimal("173.90"),
        Decimal("3.90"),
        Decimal("170.00"),
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        BillingDocumentItem.objects.filter(pk=fee.pk).update(credits_company=False)


def test_the_issuance_adds_the_fee_as_its_own_line(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: BillingRules, make_unit, link, make_plan_item, fee_event: BillingEvent
) -> None:
    unit = make_unit("101")
    link(unit, "Maria")
    _ = make_plan_item()
    entry = fee_entry(condominium, fee_event)
    _ = BillingEntryUnit.objects.create(entry=entry, unit=unit)

    run = issue_condominium_billing(condominium, OCTOBER)

    document = BillingDocument.objects.get()
    assert run.status == BillingRun.Status.SUCCEEDED
    assert [(line.description, line.amount, line.credits_company) for line in document.items.all()] == [
        ("Taxa condominial", Decimal("450.00"), False),
        ("0005-TARIFA BANCO", Decimal("3.90"), True),
    ]
    assert document.amount == Decimal("453.90")


def test_the_discount_never_applies_to_the_fee(  # type: ignore[no-untyped-def]
    billing_rules: BillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    document = create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
                NewBillingDocumentItem("0052-CONDOMINIO", cost_center, entry_template, Decimal("200.00")),
            )
        )
    )

    payload = _charge_payload(document, "cus_1", document.due_date, str(document.pk))

    assert payload["value"] == 203.9
    assert payload["discount"] == {"value": 10.0, "dueDateLimitDays": 3, "type": "FIXED"}
    # The multa and the interest are over the whole boleto, the fee included.
    assert payload["fine"] == {"value": 2.0, "type": "PERCENTAGE"}


def test_without_a_fee_the_discount_stays_a_percentage(document: BillingDocument) -> None:
    payload = _charge_payload(document, "cus_1", document.due_date, str(document.pk))

    assert payload["discount"] == {"value": 5.0, "dueDateLimitDays": 3, "type": "PERCENTAGE"}


# ----- the payment -----


@pytest.fixture
def fee_document(  # type: ignore[no-untyped-def]
    billing_rules: BillingRules, new_document, cost_center: CostCenter, entry_template: EntryTemplate
) -> BillingDocument:
    return create_billing_document(
        new_document(
            items=(
                NewBillingDocumentItem("0005-TARIFA BANCO", None, None, Decimal("3.90")),
                NewBillingDocumentItem("0052-CONDOMINIO", cost_center, entry_template, Decimal("170.00")),
            )
        )
    )


@pytest.fixture
def registered_fee_document(fee_document: BillingDocument) -> tuple[BillingDocument, GatewayAccount]:
    from ..models import BillingDocumentRegistration

    account = GatewayAccount.objects.create(
        company=fee_document.unit.condominium.company, api_key="k", webhook_token="t", status=GatewayAccount.Status.ACTIVE
    )
    _ = BillingDocumentRegistration.objects.create(
        document=fee_document, gateway_account=account, registered_due_date=fee_document.due_date, gateway_payment_id="pay_1"
    )
    fee_document.status = BillingDocument.Status.REGISTERED
    fee_document.save()
    return fee_document, account


def test_the_fee_is_credited_to_the_administradora_and_never_to_the_condominium(
    registered_fee_document: tuple[BillingDocument, GatewayAccount],
) -> None:
    document, account = registered_fee_document

    event = process_gateway_event(make_event(account, received(document)))

    assert event.outcome == GatewayEvent.Outcome.PROCESSED
    company_entry = CompanyEntry.objects.get()
    assert (company_entry.amount, company_entry.company_id) == (Decimal("3.90"), document.unit.condominium.company_id)
    condominium_entries = list(CurrentAccountEntry.objects.all())
    assert [entry.amount for entry in condominium_entries] == [Decimal("170.00")]
    assert CurrentAccount.objects.get().balance == Decimal("170.00")


def test_a_company_entry_never_changes_or_goes(registered_fee_document: tuple[BillingDocument, GatewayAccount]) -> None:
    document, account = registered_fee_document
    _ = process_gateway_event(make_event(account, received(document)))
    company_entry = CompanyEntry.objects.get()

    company_entry.amount = Decimal("1.00")
    with pytest.raises(ValidationError):
        company_entry.save()
    with pytest.raises(ValidationError):
        company_entry.delete()


def test_a_second_copy_charges_the_same_fee_once(registered_fee_document: tuple[BillingDocument, GatewayAccount]) -> None:
    """A reissue registers a new charge for the same document: it has the same lines, so the fee is one."""
    from ..models import BillingDocumentRegistration

    document, account = registered_fee_document
    items_before = document.items.count()
    BillingDocumentRegistration.objects.filter(document=document).update(status=BillingDocumentRegistration.Status.REPLACED)
    _ = BillingDocumentRegistration.objects.create(
        document=document,
        gateway_account=account,
        registered_due_date=document.due_date,
        gateway_payment_id="pay_2",
        reason=BillingDocumentRegistration.Reason.REISSUE,
    )

    _ = process_gateway_event(make_event(account, received(document, id="pay_2")))

    assert document.items.count() == items_before == 2
    assert document.amount == Decimal("173.90")
    assert CompanyEntry.objects.count() == 1
    assert CompanyEntry.objects.get().amount == Decimal("3.90")
