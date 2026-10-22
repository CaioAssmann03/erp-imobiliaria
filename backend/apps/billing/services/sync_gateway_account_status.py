from typing import Any, Protocol

from django.db import transaction
from django.utils import timezone

from apps.billing.gateway.asaas_client import AsaasClient
from apps.billing.models import GatewayAccount

APPROVED = "APPROVED"
REJECTED = "REJECTED"


class StatusReader(Protocol):
    def get_account_status(self) -> dict[str, Any]: ...


def sync_gateway_account_status(account: GatewayAccount, client: StatusReader | None = None) -> GatewayAccount:
    """Follow the gateway's general approval: approved activates, rejected blocks, anything else keeps the status."""
    reader = client or AsaasClient(api_key=account.api_key)
    general = reader.get_account_status().get("general")
    with transaction.atomic():
        locked = GatewayAccount.objects.select_for_update().get(pk=account.pk)
        if general == APPROVED and locked.status != GatewayAccount.Status.ACTIVE:
            locked.status = GatewayAccount.Status.ACTIVE
            locked.approved_at = locked.approved_at or timezone.now()
            locked.save()
        elif general == REJECTED and locked.status != GatewayAccount.Status.BLOCKED:
            locked.status = GatewayAccount.Status.BLOCKED
            locked.save()
    account.refresh_from_db()
    return account
