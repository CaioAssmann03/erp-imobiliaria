from datetime import date, datetime
from typing import Any

from django.db import transaction
from django.utils import timezone

from config.celery import app as celery_app
from apps.billing.errors import BillingDocumentRegistrationError, GatewayAccountError
from apps.billing.infrastructure.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import BillingDocument, BillingDocumentRegistration, GatewayAccount
from apps.billing.infrastructure.gateway.charges import ChargeGateway, ensure_customer, fetch_boleto_details, find_or_create_charge


def register_billing_document(
    document: BillingDocument, client: ChargeGateway | None = None
) -> BillingDocumentRegistration:
    """Register an issued document as a boleto charge at its condominium's gateway account (spec 031).

    Idempotent: a document with an active registration gets it back, and a charge that already exists at the
    gateway (found by `externalReference`, the document id) is reused after a lost response. A gateway outage
    raises `GatewayUnavailable` (retry later); a refusal is kept as a `failed` registration and returned.
    """
    active = document.registrations.filter(status=BillingDocumentRegistration.Status.ACTIVE).first()
    if active is not None:
        return active
    if document.status != BillingDocument.Status.ISSUED:
        raise GatewayError(BillingDocumentRegistrationError.DOCUMENT_NOT_ISSUED)
    account = GatewayAccount.objects.filter(company_id=document.unit.condominium.company_id).first()
    if account is None or not account.can_register_charges():
        raise GatewayError(BillingDocumentRegistrationError.NO_ACTIVE_GATEWAY_ACCOUNT)
    if document.payer.tax_id is None:
        raise GatewayError(BillingDocumentRegistrationError.PAYER_WITHOUT_DOCUMENT)

    gateway = client or AsaasClient(api_key=account.api_key)
    try:
        customer_id = ensure_customer(document.payer, account, gateway)
        payment = find_or_create_charge(document, customer_id, gateway, document.due_date, str(document.pk))
        details = fetch_boleto_details(payment["id"], gateway)
    except GatewayError as error:
        if error.error is not GatewayAccountError.GATEWAY_REJECTED:
            raise
        return record_failure(document, account, error.codes)
    return record_registration(document, account, payment, details)


def record_registration(
    document: BillingDocument,
    account: GatewayAccount,
    payment: dict[str, Any],
    details: dict[str, Any],
    reason: str = BillingDocumentRegistration.Reason.INITIAL_ISSUE,
    due_date: date | None = None,
) -> BillingDocumentRegistration:
    """Save the active registration of a charge and move the document to `registered` (a reissue keeps it there)."""
    identification, pix = details["identification"], details["pix"]
    with transaction.atomic():
        locked = BillingDocument.objects.select_for_update().get(pk=document.pk)
        registration = BillingDocumentRegistration(
            document=locked,
            gateway_account=account,
            reason=reason,
            registered_due_date=due_date or locked.due_date,
            gateway_payment_id=str(payment["id"]),
            our_number=str(identification.get("nossoNumero") or ""),
            digitable_line=str(identification.get("identificationField") or ""),
            barcode=str(identification.get("barCode") or ""),
            boleto_url=str(payment.get("bankSlipUrl") or ""),
            pix_payload=str(pix.get("payload") or ""),
            pix_expires_at=_parse_expiry(pix.get("expirationDate")),
        )
        registration.full_clean()
        registration.save()
        if locked.status != BillingDocument.Status.REGISTERED:
            locked.status = BillingDocument.Status.REGISTERED
            locked.full_clean()
            locked.save()
        document_id = str(locked.pk)
        # By name: tasks.py imports this module. The payer is e-mailed once the registration has committed (spec 035).
        transaction.on_commit(
            lambda: celery_app.send_task("apps.billing.tasks.send_billing_document_email_task", args=[document_id])
        )
    document.refresh_from_db()
    return registration


def record_failure(
    document: BillingDocument,
    account: GatewayAccount,
    codes: tuple[str, ...],
    reason: str = BillingDocumentRegistration.Reason.INITIAL_ISSUE,
    due_date: date | None = None,
) -> BillingDocumentRegistration:
    registration = BillingDocumentRegistration(
        document=document,
        gateway_account=account,
        status=BillingDocumentRegistration.Status.FAILED,
        reason=reason,
        registered_due_date=due_date or document.due_date,
        error_codes=list(codes),
    )
    registration.full_clean()
    registration.save()
    return registration


def _parse_expiry(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace(" ", "T"))
    except ValueError:
        return None
    return timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed
