from typing import Protocol

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.billing.infrastructure.rendering.delivery_email import build_boleto_email
from apps.billing.infrastructure.gateway.resend_client import EmailNotConfigured, EmailRejected, ResendClient
from apps.billing.models import BillingDocument, BillingDocumentDelivery, BillingDocumentRegistration

Status = BillingDocumentDelivery.Status


class EmailSender(Protocol):
    def send(self, to: str, subject: str, html: str, text: str, idempotency_key: str) -> str: ...


def send_billing_document_email(document: BillingDocument, sender: EmailSender | None = None) -> BillingDocumentDelivery | None:
    """E-mail the document's active registration to its payer, once (spec 035); None when there is no registration.

    There is one delivery per registration and channel: a repeat gets it back, and the provider's idempotency key is the
    delivery id, so a retry after a lost response cannot send twice. A payer without an e-mail, an unconfigured
    provider and a refusal are recorded as `failed` with a reason; only an unavailable provider raises (retry later).
    """
    registration = document.registrations.filter(status=BillingDocumentRegistration.Status.ACTIVE).first()
    if registration is None:
        return None
    delivery = _delivery_of(document, registration)
    if delivery.status != Status.PENDING:
        return delivery
    if not document.payer.email:
        return _fail(delivery, "payer_without_email")
    delivery.destination = document.payer.email
    subject, html, text = build_boleto_email(document, registration)
    try:
        message_id = (sender or ResendClient()).send(delivery.destination, subject, html, text, str(delivery.pk))
    except EmailNotConfigured:
        return _fail(delivery, "email_not_configured")
    except EmailRejected:
        return _fail(delivery, "provider_rejected")
    delivery.status = Status.SENT
    delivery.provider_message_id = message_id
    delivery.sent_at = timezone.now()
    delivery.full_clean()
    delivery.save()
    return delivery


def _delivery_of(document: BillingDocument, registration: BillingDocumentRegistration) -> BillingDocumentDelivery:
    try:
        with transaction.atomic():
            return BillingDocumentDelivery.objects.create(document=document, registration=registration)
    except IntegrityError:
        return BillingDocumentDelivery.objects.get(registration=registration, channel=BillingDocumentDelivery.Channel.EMAIL)


def _fail(delivery: BillingDocumentDelivery, reason: str) -> BillingDocumentDelivery:
    delivery.status = Status.FAILED
    delivery.failure_reason = reason
    delivery.full_clean()
    delivery.save()
    return delivery
