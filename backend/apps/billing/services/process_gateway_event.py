from datetime import date
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.billing.models import BillingDocument, BillingDocumentRegistration, GatewayEvent
from apps.billing.services.post_billing_document_payment import post_billing_document_payment

PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
PAYMENT_REFUNDED = "PAYMENT_REFUNDED"
# The charge exists no more, or its registration expired: it cannot be paid until a reissue (spec 034).
CANCELLATION_EVENTS = ("PAYMENT_BANK_SLIP_CANCELLED", "PAYMENT_DELETED")
Outcome = GatewayEvent.Outcome


def process_gateway_event(event: GatewayEvent) -> GatewayEvent:
    """Act on one stored gateway event, once: `PAYMENT_RECEIVED` posts the payment, a cancellation marks the registration,
    a refund goes to staff, any other event is only kept.

    A repeat (the event is no longer `pending`) changes nothing. What cannot be posted is not guessed: the event
    becomes `unprocessed` with a reason, for staff to resolve (spec 032).
    """
    with transaction.atomic():
        locked = GatewayEvent.objects.select_for_update().select_related("gateway_account").get(pk=event.pk)
        if locked.outcome != Outcome.PENDING:
            return locked
        if locked.event_type == PAYMENT_RECEIVED:
            outcome, reason, codes = _settle_received_payment(locked)
        elif locked.event_type in CANCELLATION_EVENTS:
            outcome, reason, codes = _settle_cancellation(locked)
        elif locked.event_type == PAYMENT_REFUNDED:
            outcome, reason, codes = _settle_refund(locked)
        else:
            outcome, reason, codes = Outcome.IGNORED, "event_not_handled", []
        return _finish(locked, outcome, reason, codes)


def _registration_of(event: GatewayEvent) -> BillingDocumentRegistration | None:
    return (
        BillingDocumentRegistration.objects.select_related("document__unit__condominium")
        .filter(gateway_account=event.gateway_account, gateway_payment_id=str(event.payment.get("id") or ""))
        .exclude(gateway_payment_id="")
        .first()
    )


def _settle_cancellation(event: GatewayEvent) -> tuple[str, str, list[str]]:
    registration = _registration_of(event)
    if registration is None:
        return Outcome.IGNORED, "unknown_charge", []
    if registration.status != BillingDocumentRegistration.Status.ACTIVE:
        # Our own reissue cancels the old charge: its event arrives for a registration already replaced.
        return Outcome.IGNORED, "registration_not_active", []
    BillingDocumentRegistration.objects.filter(pk=registration.pk).update(
        status=BillingDocumentRegistration.Status.CANCELLED
    )
    return Outcome.PROCESSED, "", []


def _settle_refund(event: GatewayEvent) -> tuple[str, str, list[str]]:
    registration = _registration_of(event)
    if registration is not None and registration.document.status == BillingDocument.Status.PAID:
        # The money went back: the ledger entries are reversed by staff (the entries are never edited).
        return Outcome.UNPROCESSED, "payment_refunded", []
    return Outcome.IGNORED, "refund_without_payment", []


def _settle_received_payment(event: GatewayEvent) -> tuple[str, str, list[str]]:
    payment = event.payment
    registration = _registration_of(event)
    if registration is None:
        return Outcome.UNPROCESSED, "unknown_charge", []
    if registration.status != BillingDocumentRegistration.Status.ACTIVE:
        return Outcome.UNPROCESSED, "charge_not_active", []
    document = BillingDocument.objects.select_for_update().get(pk=registration.document_id)
    if document.status == BillingDocument.Status.PAID:
        return Outcome.IGNORED, "already_paid", []
    if document.status != BillingDocument.Status.REGISTERED:
        return Outcome.UNPROCESSED, "document_not_registered", []
    paid_amount = _decimal(payment.get("value"))
    if paid_amount is None:
        return Outcome.UNPROCESSED, "invalid_payload", []
    if paid_amount != document.amount:
        return Outcome.UNPROCESSED, "amount_mismatch", []
    try:
        with transaction.atomic():
            _ = post_billing_document_payment(document, registration, event, paid_amount, _paid_on(payment))
    except ValidationError as error:
        return Outcome.UNPROCESSED, "posting_refused", _error_codes(error)
    return Outcome.PROCESSED, "", []


def _finish(event: GatewayEvent, outcome: str, reason: str = "", codes: list[str] | None = None) -> GatewayEvent:
    event.outcome = outcome
    event.reason = reason
    event.error_codes = codes or []
    event.processed_at = timezone.now()
    event.save(update_fields=["outcome", "reason", "error_codes", "processed_at", "updated_at"])
    return event


def _decimal(value: object) -> Decimal | None:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01")) if value is not None else None
    except InvalidOperation:
        return None


def _paid_on(payment: dict[str, object]) -> date:
    try:
        return date.fromisoformat(str(payment.get("paymentDate")))
    except ValueError:
        return timezone.localdate()


def _error_codes(error: ValidationError) -> list[str]:
    errors = [item for group in error.error_dict.values() for item in group] if hasattr(error, "error_dict") else error.error_list
    return sorted({str(item.code) for item in errors if item.code})
