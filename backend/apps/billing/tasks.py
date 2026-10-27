from datetime import date

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from apps.billing.infrastructure.gateway.asaas_client import GatewayUnavailable
from apps.billing.infrastructure.gateway.resend_client import EmailUnavailable
from apps.billing.models import (
    BillingDocument,
    CondominiumBillingRules,
    GatewayAccount,
    GatewayEvent,
)
from apps.billing.services.generate_billing_document_pdf import (
    generate_billing_document_pdf,
)
from apps.billing.services.issue_condominium_billing import issue_condominium_billing
from apps.billing.services.process_gateway_event import process_gateway_event
from apps.billing.services.reconcile_gateway_account import reconcile_gateway_account
from apps.billing.services.register_billing_document import register_billing_document
from apps.billing.services.send_billing_document_email import (
    send_billing_document_email,
)
from apps.condominiums.models import Condominium


@shared_task
def issue_due_billing() -> int:
    """Daily: enqueue the issuance of every active condominium whose issuance day is today.

    The reference month is the month of today. Returns how many condominiums were enqueued.
    """
    today = timezone.localdate()
    condominium_ids = CondominiumBillingRules.objects.filter(
        issuance_day=today.day, condominium__active=True
    ).values_list("condominium_id", flat=True)
    count = 0
    for condominium_id in condominium_ids:
        _ = issue_condominium_billing_task.delay(
            str(condominium_id), today.replace(day=1).isoformat()
        )
        count += 1
    return count


@shared_task
def issue_condominium_billing_task(condominium_id: str, reference_month: str) -> str:
    """Issue one condominium's month; the id of the `BillingRun` it recorded."""
    condominium = Condominium.objects.get(pk=condominium_id)
    run = issue_condominium_billing(condominium, date.fromisoformat(reference_month))
    return str(run.pk)


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def generate_billing_document_pdf_task(document_id: str) -> str:
    """Generate (or replace) the draft PDF of one document; the id of its `BillingDocumentPdf`.

    Retried with backoff; once the retries run out the error stays in the task log, and the issuance that
    enqueued it is not affected.
    """
    document = (
        BillingDocument.objects.select_related(
            "unit__block",
            "unit__condominium__company",
            "unit__condominium__address",
            "payer",
        )
        .prefetch_related("items__cost_center")
        .get(pk=document_id)
    )
    return str(generate_billing_document_pdf(document).pk)


@shared_task(autoretry_for=(GatewayUnavailable,), retry_backoff=True, max_retries=5)
def register_billing_document_task(document_id: str) -> str:
    """Register one issued document as a charge at the gateway; the id of the registration it recorded.

    Retried with backoff only while the gateway is unavailable; a refusal is recorded as a `failed` registration.
    """
    document = BillingDocument.objects.select_related(
        "unit__condominium", "payer__people_individual", "payer__people_legal"
    ).get(pk=document_id)
    return str(register_billing_document(document).pk)


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=5)
def process_gateway_event_task(event_id: str) -> str:
    """Process one stored gateway event; its outcome. Retried on an unexpected error (the event stays `pending`)."""
    return str(process_gateway_event(GatewayEvent.objects.get(pk=event_id)).outcome)


@shared_task
def reconcile_gateway_accounts() -> int:
    """Daily: reconcile every active gateway account over the configured window; how many accounts were reconciled.

    An account's failure (a gateway outage) is recorded in its run and does not stop the others.
    """
    accounts = list(GatewayAccount.objects.filter(status=GatewayAccount.Status.ACTIVE))
    for account in accounts:
        _ = reconcile_gateway_account(
            account, settings.GATEWAY_RECONCILIATION_WINDOW_DAYS
        )
    return len(accounts)


@shared_task(autoretry_for=(EmailUnavailable,), retry_backoff=True, max_retries=5)
def send_billing_document_email_task(document_id: str) -> str:
    """E-mail one registered document to its payer; the delivery's status ('' when it has no registration).

    Retried with backoff only while the provider is unavailable; every other failure is a `failed` delivery.
    """
    document = BillingDocument.objects.select_related("unit__condominium", "payer").get(
        pk=document_id
    )
    delivery = send_billing_document_email(document)
    return delivery.status if delivery else ""
