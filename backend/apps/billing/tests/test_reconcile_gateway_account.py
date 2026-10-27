"""The daily reconciliation of received payments (spec 033, R1–R6)."""

from datetime import date, timedelta
from typing import Any

import pytest

from apps.billing.errors import GatewayAccountError
from apps.billing.gateway.asaas_client import GatewayUnavailable
from apps.core.models import Company
from apps.finance.models import CurrentAccountEntry

from .. import tasks
from ..models import (
    BillingDocument,
    BillingDocumentRegistration,
    GatewayAccount,
    GatewayEvent,
    GatewayReconciliationRun,
)
from ..services.reconcile_gateway_account import reconcile_gateway_account

pytestmark = pytest.mark.django_db


class FakeReceived:
    def __init__(self, payments: list[dict[str, Any]] | None = None, failure: Exception | None = None) -> None:
        self.payments = payments or []
        self.failure = failure
        self.windows: list[tuple[date, date]] = []

    def list_received_payments(self, received_from: date, received_to: date) -> list[dict[str, Any]]:
        self.windows.append((received_from, received_to))
        if self.failure:
            raise self.failure
        return self.payments


@pytest.fixture
def account(document: BillingDocument) -> GatewayAccount:
    return GatewayAccount.objects.create(
        company=document.unit.condominium.company,
        api_key="k",
        webhook_token="t",
        status=GatewayAccount.Status.ACTIVE,
    )


@pytest.fixture
def registered(document: BillingDocument, account: GatewayAccount) -> BillingDocumentRegistration:
    registration = BillingDocumentRegistration.objects.create(
        document=document, gateway_account=account, registered_due_date=document.due_date, gateway_payment_id="pay_1"
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()
    return registration


def payment(document: BillingDocument, **overrides: Any) -> dict[str, Any]:
    return {"id": "pay_1", "value": float(document.amount), "paymentDate": "2026-10-20", **overrides}


def test_a_payment_the_webhook_missed_is_posted_through_the_same_path(  # type: ignore[no-untyped-def]
    document: BillingDocument, registered, account: GatewayAccount
) -> None:
    gateway = FakeReceived([payment(document)])

    run = reconcile_gateway_account(account, 3, gateway)

    document.refresh_from_db()
    assert document.status == BillingDocument.Status.PAID
    assert (run.status, run.found_count, run.processed_count, run.unprocessed_count) == ("succeeded", 1, 1, 0)
    assert CurrentAccountEntry.objects.count() == document.items.count()
    assert gateway.windows[0][1] - gateway.windows[0][0] == timedelta(days=3)


def test_it_never_posts_twice(document: BillingDocument, registered, account: GatewayAccount) -> None:  # type: ignore[no-untyped-def]
    gateway = FakeReceived([payment(document)])
    _ = reconcile_gateway_account(account, 3, gateway)

    second = reconcile_gateway_account(account, 3, gateway)

    assert (second.processed_count, second.already_posted_count) == (0, 1)
    assert CurrentAccountEntry.objects.count() == document.items.count()


def test_what_cannot_be_posted_lands_in_the_unprocessed_queue_once(  # type: ignore[no-untyped-def]
    document: BillingDocument, registered, account: GatewayAccount
) -> None:
    gateway = FakeReceived([payment(document, value=1.0), payment(document, id="pay_unknown")])

    first = reconcile_gateway_account(account, 3, gateway)
    again = reconcile_gateway_account(account, 3, gateway)

    assert (first.unprocessed_count, first.processed_count) == (2, 0)
    assert again.unprocessed_count == 2  # counted again, but not stored again
    reasons = sorted(GatewayEvent.objects.filter(outcome="unprocessed").values_list("reason", flat=True))
    assert reasons == ["amount_mismatch", "unknown_charge"]
    assert not CurrentAccountEntry.objects.exists()


def test_a_gateway_outage_fails_the_run_and_keeps_the_others_going(  # type: ignore[no-untyped-def]
    document: BillingDocument, registered, account: GatewayAccount, monkeypatch: pytest.MonkeyPatch
) -> None:
    failing = FakeReceived(failure=GatewayUnavailable("timeout"))

    run = reconcile_gateway_account(account, 3, failing)

    assert run.status == GatewayReconciliationRun.Status.FAILED
    assert run.error_code == GatewayAccountError.GATEWAY_UNAVAILABLE.value
    document.refresh_from_db()
    assert document.status == BillingDocument.Status.REGISTERED


def test_the_daily_task_runs_every_active_account(  # type: ignore[no-untyped-def]
    document: BillingDocument, registered, account: GatewayAccount, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[tuple[GatewayAccount, int]] = []
    monkeypatch.setattr(tasks, "reconcile_gateway_account", lambda acc, days: seen.append((acc, days)))
    GatewayAccount.objects.create(
        company=Company.objects.create(legal_name="Outra Administradora", cnpj="45723174000110"),
        api_key="k",
        webhook_token="t2",
    )  # pending: not reconciled

    assert tasks.reconcile_gateway_accounts() == 1
    assert [a for a, _ in seen] == [account]
