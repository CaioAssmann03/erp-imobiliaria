from datetime import date
from typing import Any, Protocol

from django.conf import settings

from apps.billing.errors import GatewayAccountError
from apps.billing.gateway.asaas_client import GatewayError
from apps.billing.models import BillingDocument, GatewayAccount, GatewayCustomer
from apps.persons.models import Person


class ChargeGateway(Protocol):
    def find_customers(self, query: dict[str, str]) -> list[dict[str, Any]]: ...
    def create_customer(self, payload: dict[str, Any]) -> dict[str, Any]: ...
    def find_payments_by_external_reference(self, external_reference: str) -> list[dict[str, Any]]: ...
    def create_payment(self, payload: dict[str, Any]) -> dict[str, Any]: ...
    def get_identification_field(self, payment_id: str) -> dict[str, Any]: ...
    def get_pix_qr_code(self, payment_id: str) -> dict[str, Any]: ...


def ensure_customer(person: Person, account: GatewayAccount, gateway: ChargeGateway) -> str:
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


def find_or_create_charge(
    document: BillingDocument, customer_id: str, gateway: ChargeGateway, due_date: date, external_reference: str
) -> dict[str, Any]:
    """The charge the gateway already holds for this reference (a retry after a lost response), or a new one."""
    existing = gateway.find_payments_by_external_reference(external_reference)
    if existing:
        return existing[0]
    return gateway.create_payment(_charge_payload(document, customer_id, due_date, external_reference))


def _charge_payload(document: BillingDocument, customer_id: str, due_date: date, external_reference: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "customer": customer_id,
        "billingType": "BOLETO",
        "value": float(document.amount),
        "dueDate": due_date.isoformat(),
        "description": f"{document.unit.condominium.name} - {document.unit} - {document.reference_month:%m/%Y}",
        "externalReference": external_reference,
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


def fetch_boleto_details(payment_id: str, gateway: ChargeGateway) -> dict[str, Any]:
    identification = gateway.get_identification_field(payment_id)
    try:
        pix = gateway.get_pix_qr_code(payment_id)
    except GatewayError as error:
        # Without a usable Pix QR code the boleto is still payable: the registration keeps the rest.
        if error.error is not GatewayAccountError.GATEWAY_REJECTED:
            raise
        pix = {}
    return {"identification": identification, "pix": pix}
