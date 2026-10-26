import secrets
from typing import Any, Protocol

from django.db import transaction

from apps.billing.errors import GatewayAccountError
from apps.billing.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import GatewayAccount
from apps.core.models import Company


class StatusReader(Protocol):
    def get_account_status(self) -> dict[str, Any]: ...


def set_up_gateway_account(company: Company, api_key: str, client: StatusReader | None = None) -> GatewayAccount:
    """Store the company's gateway key (encrypted), check it against the gateway and activate the account.

    The webhook token is generated once; running it again with another key replaces only the key.
    A key the gateway refuses stores nothing.
    """
    gateway = client or AsaasClient(api_key=api_key)
    try:
        gateway.get_account_status()
    except GatewayError as error:
        if error.error is GatewayAccountError.GATEWAY_REJECTED:
            raise GatewayError(GatewayAccountError.API_KEY_INVALID, codes=error.codes) from None
        raise
    with transaction.atomic():
        account = GatewayAccount.objects.select_for_update().filter(company=company).first()
        if account is None:
            account = GatewayAccount(company=company, webhook_token=secrets.token_urlsafe(32))
        account.api_key = api_key
        account.status = GatewayAccount.Status.ACTIVE
        account.full_clean()
        account.save()
    return account
