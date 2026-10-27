"""The Asaas webhook and the posting of a received payment (spec 032, R1–R9)."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.services.create_billing_document import (
    NewBillingDocumentItem,
    create_billing_document,
)
from apps.finance.models import (
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryTemplate,
)

from ..models import (
    BillingDocument,
    BillingDocumentPayment,
    BillingDocumentRegistration,
    GatewayAccount,
    GatewayEvent,
)
from ..services.process_gateway_event import process_gateway_event

pytestmark = pytest.mark.django_db

URL = "asaas-webhook"
TOKEN = "webhook-token-of-the-account-0123456789"


@pytest.fixture
def account(document: BillingDocument) -> GatewayAccount:
    return GatewayAccount.objects.create(
        company=document.unit.condominium.company,
        api_key="k",
        webhook_token=TOKEN,
        status=GatewayAccount.Status.ACTIVE,
    )


@pytest.fixture
def registered(document: BillingDocument, account: GatewayAccount) -> BillingDocumentRegistration:
    registration = BillingDocumentRegistration.objects.create(
        document=document,
        gateway_account=account,
        registered_due_date=document.due_date,
        gateway_payment_id="pay_1",
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()
    return registration


def received(document: BillingDocument, event_id: str = "evt_1", **payment: Any) -> dict[str, Any]:
    return {
        "id": event_id,
        "event": "PAYMENT_RECEIVED",
        "payment": {"id": "pay_1", "value": float(document.amount), "netValue": 448.0, "paymentDate": "2026-10-20", **payment},
        "unknown_field": "ignored",
    }


def make_event(account: GatewayAccount, payload: dict[str, Any]) -> GatewayEvent:
    return GatewayEvent.objects.create(
        gateway_account=account, event_id=payload["id"], event_type=payload["event"], payload=payload
    )


def post(token: str | None, payload: Any) -> Any:
    client = APIClient()
    if token is not None:
        client.credentials(HTTP_ASAAS_ACCESS_TOKEN=token)
    return client.post(reverse(URL), payload, format="json")


# ----- R1, R2: the endpoint -----


@pytest.mark.parametrize("token", [None, "", "wrong-token"])
def test_a_missing_or_wrong_token_is_refused(account: GatewayAccount, document: BillingDocument, token: str | None) -> None:
    assert post(token, received(document)).status_code == status.HTTP_401_UNAUTHORIZED
    assert not GatewayEvent.objects.exists()


def test_a_valid_event_is_stored_once_and_answered_200(account: GatewayAccount, document: BillingDocument) -> None:
    first = post(TOKEN, received(document))
    repeat = post(TOKEN, received(document))

    assert (first.status_code, repeat.status_code) == (status.HTTP_200_OK, status.HTTP_200_OK)
    assert GatewayEvent.objects.count() == 1
    assert GatewayEvent.objects.get().gateway_account == account


def test_a_malformed_body_is_refused_without_storing(account: GatewayAccount) -> None:
    assert post(TOKEN, {"no": "id"}).status_code == status.HTTP_400_BAD_REQUEST
    assert post(TOKEN, [1, 2]).status_code == status.HTTP_400_BAD_REQUEST
    assert not GatewayEvent.objects.exists()


def test_processing_is_enqueued_after_the_commit_never_inside_the_request(  # type: ignore[no-untyped-def]
    account: GatewayAccount, document: BillingDocument, monkeypatch: pytest.MonkeyPatch, django_capture_on_commit_callbacks
) -> None:
    sent: list[str] = []
    monkeypatch.setattr("apps.billing.views.gateway_webhook_views.process_gateway_event_task.delay", sent.append)

    with django_capture_on_commit_callbacks(execute=True):
        _ = post(TOKEN, received(document))

    assert sent == [str(GatewayEvent.objects.get().pk)]
    assert GatewayEvent.objects.get().outcome == GatewayEvent.Outcome.PENDING


# ----- R3, R4: posting -----


def test_a_received_payment_posts_one_credit_per_item_and_marks_the_document_paid(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    event = process_gateway_event(make_event(account, received(document)))

    document.refresh_from_db()
    entries = list(CurrentAccountEntry.objects.order_by("registry"))
    assert event.outcome == GatewayEvent.Outcome.PROCESSED
    assert document.status == BillingDocument.Status.PAID
    items = list(document.items.order_by("position"))
    assert [(e.kind, e.amount, e.cost_center, e.entry_template, e.origin) for e in entries] == [
        ("credit", item.amount, item.cost_center, item.entry_template, "automatic_billing") for item in items
    ]
    assert all(e.created_by is None and e.unit == document.unit and e.entry_date == date(2026, 10, 20) for e in entries)
    payment = BillingDocumentPayment.objects.get()
    assert (payment.amount, payment.net_amount, payment.paid_on) == (document.amount, Decimal("448.00"), date(2026, 10, 20))
    assert CurrentAccount.objects.get().balance == document.amount


def test_a_repeated_event_posts_nothing_twice(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    event = make_event(account, received(document))
    _ = process_gateway_event(event)
    _ = process_gateway_event(event)
    other = process_gateway_event(make_event(account, received(document, event_id="evt_2")))

    assert CurrentAccountEntry.objects.count() == document.items.count()
    assert other.outcome == GatewayEvent.Outcome.IGNORED and other.reason == "already_paid"


# ----- R5, R6: what is not posted -----


def test_a_different_amount_goes_to_the_unprocessed_queue_and_posts_nothing(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    event = process_gateway_event(make_event(account, received(document, value=float(document.amount) + 12)))

    document.refresh_from_db()
    assert (event.outcome, event.reason) == (GatewayEvent.Outcome.UNPROCESSED, "amount_mismatch")
    assert document.status == BillingDocument.Status.REGISTERED
    assert not CurrentAccountEntry.objects.exists()


@pytest.mark.parametrize(
    ("change", "reason"),
    [("unknown", "unknown_charge"), ("replaced", "charge_not_active"), ("cancelled", "document_not_registered")],
)
def test_an_unmatched_payment_is_queued_with_its_reason(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount, change: str, reason: str
) -> None:
    if change == "unknown":
        payload = received(document, id="pay_unknown")
    elif change == "replaced":
        BillingDocumentRegistration.objects.filter(pk=registered.pk).update(status="replaced")
        payload = received(document)
    else:
        BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.CANCELLED)
        payload = received(document)

    event = process_gateway_event(make_event(account, payload))

    assert (event.outcome, event.reason) == (GatewayEvent.Outcome.UNPROCESSED, reason)
    assert not CurrentAccountEntry.objects.exists()


# ----- R7: other events -----


@pytest.mark.parametrize("name", ["PAYMENT_CONFIRMED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "SOMETHING_NEW"])
def test_other_events_are_kept_and_ignored(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount, name: str
) -> None:
    event = process_gateway_event(make_event(account, {**received(document), "event": name}))

    document.refresh_from_db()
    assert event.outcome == GatewayEvent.Outcome.IGNORED
    assert document.status == BillingDocument.Status.REGISTERED


# ----- R8: a refused posting leaves nothing -----


def test_a_refused_posting_leaves_nothing_posted(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    item = document.items.first()
    assert item is not None
    assert item.cost_center is not None
    CostCenter.objects.filter(pk=item.cost_center.pk).update(active=False)

    event = process_gateway_event(make_event(account, received(document)))

    document.refresh_from_db()
    assert (event.outcome, event.reason) == (GatewayEvent.Outcome.UNPROCESSED, "posting_refused")
    assert "current_account_entry.cost_center.inactive" in event.error_codes
    assert document.status == BillingDocument.Status.REGISTERED
    assert not CurrentAccountEntry.objects.exists() and not BillingDocumentPayment.objects.exists()


def test_the_documents_api_shows_the_payment(api_client: APIClient, document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount) -> None:
    detail = reverse("billing-document-detail", args=[document.pk])
    assert api_client.get(detail).json()["payment"] is None

    _ = process_gateway_event(make_event(account, received(document)))

    payment = api_client.get(detail).json()["payment"]
    assert (payment["paid_on"], payment["amount"], payment["net_amount"]) == ("2026-10-20", str(document.amount), "448.00")


def test_paid_document_credits_each_item_in_its_own_cost_center(  # type: ignore[no-untyped-def]
    new_document, billing_rules, cost_center: CostCenter, entry_template: EntryTemplate, account: GatewayAccount
) -> None:
    """The fee goes to the current account and an extra charge to the works fund; the money is one boleto (spec 037, R6)."""
    works_fund = CostCenter.objects.create(condominium=cost_center.condominium, name="Fundo de Obras")
    works_template = EntryTemplate.objects.create(cost_center=works_fund, name="REC Fundo de Obras")
    document = create_billing_document(
        new_document(
            reference_month=date(2026, 11, 1),
            competence_month=date(2026, 11, 1),
            due_date=date(2026, 11, 10),
            items=(
                NewBillingDocumentItem("Taxa condominial", cost_center, entry_template, Decimal("400.00")),
                NewBillingDocumentItem("Fundo de obras", works_fund, works_template, Decimal("100.00")),
            )
        )
    )
    _ = BillingDocumentRegistration.objects.create(
        document=document, gateway_account=account, registered_due_date=document.due_date, gateway_payment_id="pay_1"
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()

    _ = process_gateway_event(make_event(account, received(document)))

    credits = {entry.cost_center: entry.amount for entry in CurrentAccountEntry.objects.all()}
    assert credits == {cost_center: Decimal("400.00"), works_fund: Decimal("100.00")}
    assert CurrentAccount.objects.get().balance == Decimal("500.00")


def test_payment_is_found_by_reference_across_condominiums(  # type: ignore[no-untyped-def]
    account: GatewayAccount, other_condominium, billing_rules, new_document, payer
) -> None:
    """One account serves every condominium of the company: the payment is matched by its reference alone (spec 037, R5)."""
    from apps.billing.models import CondominiumBillingRules
    from apps.condominiums.models import Unit

    _ = CondominiumBillingRules.objects.create(condominium=other_condominium)
    other_center = CostCenter.objects.create(condominium=other_condominium, name="Taxa Ordinária")
    other_template = EntryTemplate.objects.create(cost_center=other_center, name="REC Taxa Ordinária")
    document = create_billing_document(
        new_document(
            unit=Unit.objects.create(condominium=other_condominium, name="1"),
            items=(NewBillingDocumentItem("Taxa condominial", other_center, other_template, Decimal("300.00")),),
        )
    )
    _ = BillingDocumentRegistration.objects.create(
        document=document, gateway_account=account, registered_due_date=document.due_date, gateway_payment_id="pay_1"
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()

    event = process_gateway_event(make_event(account, received(document)))

    assert event.outcome == GatewayEvent.Outcome.PROCESSED
    assert CurrentAccount.objects.get().condominium == other_condominium
