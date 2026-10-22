from datetime import datetime
from typing import Any, Protocol

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.billing.errors import BillingDocumentRegistrationError, GatewayAccountError
from apps.billing.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import BillingDocument, BillingDocumentRegistration, GatewayAccount, GatewayCustomer
from apps.persons.models import Person


class ChargeGateway(Protocol):
    def find_customers(self, query: dict[str, str]) -> list[dict[str, Any]]: ...
    def create_customer(self, payload: dict[str, Any]) -> dict[str, Any]: ...
    def find_payments_by_external_reference(self, external_reference: str) -> list[dict[str, Any]]: ...
    def create_payment(self, payload: dict[str, Any]) -> dict[str, Any]: ...
    def get_identification_field(self, payment_id: str) -> dict[str, Any]: ...
    def get_pix_qr_code(self, payment_id: str) -> dict[str, Any]: ...


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
    account = GatewayAccount.objects.filter(condominium_id=document.unit.condominium_id).first()
    if account is None or not account.can_register_charges():
        raise GatewayError(BillingDocumentRegistrationError.NO_ACTIVE_GATEWAY_ACCOUNT)
    if document.payer.tax_id is None:
        raise GatewayError(BillingDocumentRegistrationError.PAYER_WITHOUT_DOCUMENT)

    gateway = client or AsaasClient(api_key=account.api_key)
    try:
        customer_id = _customer_id(document.payer, account, gateway)
        payment = _find_or_create_payment(document, customer_id, gateway)
        details = _boleto_details(payment["id"], gateway)
    except GatewayError as error:
        if error.error is not GatewayAccountError.GATEWAY_REJECTED:
            raise
        return _record_failure(document, account, error.codes)
    return _record_registration(document, account, payment, details)


def _customer_id(person: Person, account: GatewayAccount, gateway: ChargeGateway) -> str:
    existing = GatewayCustomer.objects.filter(person=person, gateway_account=account).first()
    if existing is not None:
        return existing.gateway_customer_id
    tax_id = str(person.tax_id)
    found = gateway.find_customers({"externalReference": str(person.pk)}) or gateway.find_customers({"cpfCnpj": tax_id})
    if found:
        customer_id = str(found[0]["id"])
    else:
        created = gateway.create_customer(
            {
                "name": person.name,
                "cpfCnpj": tax_id,
                "externalReference": str(person.pk),
                "notificationDisabled": True,
            }
        )
        customer_id = str(created["id"])
    GatewayCustomer.objects.get_or_create(
        person=person, gateway_account=account, defaults={"gateway_customer_id": customer_id}
    )
    return customer_id


def _find_or_create_payment(document: BillingDocument, customer_id: str, gateway: ChargeGateway) -> dict[str, Any]:
    existing = gateway.find_payments_by_external_reference(str(document.pk))
    if existing:
        return existing[0]
    return gateway.create_payment(_charge_payload(document, customer_id))


def _charge_payload(document: BillingDocument, customer_id: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "customer": customer_id,
        "billingType": "BOLETO",
        "value": float(document.amount),
        "dueDate": document.due_date.isoformat(),
        "description": f"{document.unit.condominium.name} - {document.unit} - {document.reference_month:%m/%Y}",
        "externalReference": str(document.pk),
        "daysAfterDueDateToRegistrationCancellation": settings.ASAAS_REGISTRATION_LIFETIME_BUSINESS_DAYS,
    }
    if document.late_fee_percentage > 0:
        payload["fine"] = {"value": float(document.late_fee_percentage), "type": "PERCENTAGE"}
    if document.monthly_interest_percentage > 0:
        payload["interest"] = {"value": float(document.monthly_interest_percentage)}
    if document.discount_percentage > 0:
        payload["discount"] = {
            "value": float(document.discount_percentage),
            "dueDateLimitDays": document.discount_days,
            "type": "PERCENTAGE",
        }
    return payload


def _boleto_details(payment_id: str, gateway: ChargeGateway) -> dict[str, Any]:
    identification = gateway.get_identification_field(payment_id)
    try:
        pix = gateway.get_pix_qr_code(payment_id)
    except GatewayError as error:
        # Without a usable Pix QR code the boleto is still payable: the registration keeps the rest.
        if error.error is not GatewayAccountError.GATEWAY_REJECTED:
            raise
        pix = {}
    return {"identification": identification, "pix": pix}


def _record_registration(
    document: BillingDocument, account: GatewayAccount, payment: dict[str, Any], details: dict[str, Any]
) -> BillingDocumentRegistration:
    identification, pix = details["identification"], details["pix"]
    with transaction.atomic():
        locked = BillingDocument.objects.select_for_update().get(pk=document.pk)
        registration = BillingDocumentRegistration(
            document=locked,
            gateway_account=account,
            registered_due_date=locked.due_date,
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
        locked.status = BillingDocument.Status.REGISTERED
        locked.full_clean()
        locked.save()
    document.refresh_from_db()
    return registration


def _record_failure(
    document: BillingDocument, account: GatewayAccount, codes: tuple[str, ...]
) -> BillingDocumentRegistration:
    registration = BillingDocumentRegistration(
        document=document,
        gateway_account=account,
        status=BillingDocumentRegistration.Status.FAILED,
        registered_due_date=document.due_date,
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
