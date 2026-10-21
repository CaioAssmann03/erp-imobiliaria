import secrets
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Protocol

from django.db import transaction

from apps.billing.errors import GatewayAccountError
from apps.billing.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import GatewayAccount
from apps.condominiums.models import Condominium
from django.conf import settings

WEBHOOK_EVENTS = (
    "PAYMENT_CREATED",
    "PAYMENT_UPDATED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE",
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED",
    "PAYMENT_BANK_SLIP_CANCELLED",
)


class AccountCreator(Protocol):
    def find_accounts_by_document(self, cpf_cnpj: str) -> list[dict[str, Any]]: ...
    def create_account(self, payload: dict[str, Any]) -> dict[str, Any]: ...


@dataclass(frozen=True)
class GatewayApplicant:
    """What Asaas requires and the condominium record does not hold."""

    email: str
    mobile_phone: str
    monthly_income: Decimal
    company_type: str


@transaction.atomic
def onboard_condominium_at_gateway(
    condominium: Condominium, applicant: GatewayApplicant, client: AccountCreator | None = None
) -> GatewayAccount:
    """Create the condominium's Asaas sub-account and store the credentials the gateway gives once.

    Idempotent: a condominium that already has an account gets it back. Nothing is written when the call fails.
    """
    locked = Condominium.objects.select_for_update(of=("self",)).select_related("address").get(pk=condominium.pk)
    existing = GatewayAccount.objects.filter(condominium=locked).first()
    if existing is not None:
        return existing

    gateway = client or AsaasClient()
    if gateway.find_accounts_by_document(locked.cnpj):
        raise GatewayError(GatewayAccountError.ALREADY_REGISTERED_REMOTELY)

    webhook_token = secrets.token_urlsafe(32)
    response = gateway.create_account(_creation_payload(locked, applicant, webhook_token))

    account = GatewayAccount(
        condominium=locked,
        gateway_account_id=response["id"],
        wallet_id=response["walletId"],
        api_key=response["apiKey"],
        webhook_token=webhook_token,
    )
    account.full_clean()
    account.save()
    return account


def _creation_payload(condominium: Condominium, applicant: GatewayApplicant, webhook_token: str) -> dict[str, Any]:
    address = condominium.address
    if address is None or not all((address.street, address.number, address.district, address.zip_code)):
        raise GatewayError(GatewayAccountError.CONDOMINIUM_ADDRESS_INCOMPLETE)
    payload: dict[str, Any] = {
        "name": condominium.name,
        "email": applicant.email,
        "cpfCnpj": condominium.cnpj,
        "companyType": applicant.company_type,
        "mobilePhone": applicant.mobile_phone,
        "incomeValue": float(applicant.monthly_income),
        "address": address.street,
        "addressNumber": address.number,
        "province": address.district,
        "postalCode": address.zip_code,
    }
    if settings.ASAAS_WEBHOOK_URL:
        payload["webhooks"] = [
            {
                "name": "ERP Imobiliária",
                "url": settings.ASAAS_WEBHOOK_URL,
                "email": applicant.email,
                "enabled": True,
                "interrupted": False,
                "apiVersion": 3,
                "authToken": webhook_token,
                "sendType": "SEQUENTIALLY",
                "events": list(WEBHOOK_EVENTS),
            }
        ]
    return payload
