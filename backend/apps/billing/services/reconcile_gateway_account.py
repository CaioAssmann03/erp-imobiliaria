from datetime import timedelta
from typing import Any, Protocol

from django.utils import timezone

from apps.billing.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import BillingDocument, BillingDocumentRegistration, GatewayAccount, GatewayEvent, GatewayReconciliationRun
from apps.billing.services.process_gateway_event import PAYMENT_RECEIVED, process_gateway_event

Outcome = GatewayEvent.Outcome


class ReceivedPayments(Protocol):
    def list_received_payments(self, received_from: Any, received_to: Any) -> list[dict[str, Any]]: ...


def reconcile_gateway_account(
    account: GatewayAccount, window_days: int, client: ReceivedPayments | None = None
) -> GatewayReconciliationRun:
    """Compare the payments Asaas received in the last `window_days` with the documents paid here, and fix the gap.

    A payment we have not posted goes through the same path as the webhook (`process_gateway_event`), so there is a
    single posting rule; its event id is `reconciliation:<payment id>`, which makes a second run harmless. What cannot be
    posted lands in the unprocessed queue. Nothing is polled outside this run.
    """
    today = timezone.localdate()
    run = GatewayReconciliationRun(gateway_account=account, window_start=today - timedelta(days=window_days), window_end=today)
    run.full_clean()
    run.save()
    gateway = client or AsaasClient(api_key=account.api_key)
    try:
        payments = gateway.list_received_payments(run.window_start, run.window_end)
    except GatewayError as error:
        return _finish(run, GatewayReconciliationRun.Status.FAILED, error.error.value)
    run.found_count = len(payments)
    for payment in payments:
        _reconcile_payment(run, account, payment)
    return _finish(run, GatewayReconciliationRun.Status.SUCCEEDED)


def _reconcile_payment(run: GatewayReconciliationRun, account: GatewayAccount, payment: dict[str, Any]) -> None:
    payment_id = str(payment.get("id") or "")
    if not payment_id:
        run.unprocessed_count += 1
        return
    already_paid = BillingDocumentRegistration.objects.filter(
        gateway_account=account,
        gateway_payment_id=payment_id,
        document__status=BillingDocument.Status.PAID,
    ).exists()
    if already_paid:
        run.already_posted_count += 1
        return
    event, created = GatewayEvent.objects.get_or_create(
        event_id=f"reconciliation:{payment_id}",
        defaults={
            "gateway_account": account,
            "event_type": PAYMENT_RECEIVED,
            "payload": {"id": f"reconciliation:{payment_id}", "event": PAYMENT_RECEIVED, "payment": payment},
        },
    )
    if created:
        event = process_gateway_event(event)
    if event.outcome == Outcome.PROCESSED:
        run.processed_count += 1
    else:
        run.unprocessed_count += 1


def _finish(run: GatewayReconciliationRun, status: str, error_code: str = "") -> GatewayReconciliationRun:
    run.status = status
    run.error_code = error_code
    run.finished_at = timezone.now()
    run.full_clean()
    run.save()
    return run
