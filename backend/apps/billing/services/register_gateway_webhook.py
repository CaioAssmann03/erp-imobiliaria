from typing import Any, Protocol

from django.conf import settings

from apps.billing.errors import GatewayAccountError
from apps.billing.infrastructure.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import GatewayAccount

WEBHOOK_NAME = "METRI"
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


class WebhookRegistry(Protocol):
    def list_webhooks(self) -> list[dict[str, Any]]: ...
    def create_webhook(self, payload: dict[str, Any]) -> dict[str, Any]: ...
    def update_webhook(
        self, webhook_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]: ...


def register_gateway_webhook(
    account: GatewayAccount, email: str, client: WebhookRegistry | None = None
) -> str:
    """Make the gateway post its payment events to `ASAAS_WEBHOOK_URL` with the account's token; returns the webhook id.

    Idempotent: a webhook already registered for the same URL is updated instead of duplicated.
    """
    if not settings.ASAAS_WEBHOOK_URL:
        raise GatewayError(GatewayAccountError.WEBHOOK_URL_MISSING)
    gateway = client or AsaasClient(api_key=account.api_key)
    payload: dict[str, Any] = {
        "name": WEBHOOK_NAME,
        "url": settings.ASAAS_WEBHOOK_URL,
        "email": email,
        "enabled": True,
        "interrupted": False,
        "apiVersion": 3,
        "authToken": account.webhook_token,
        "sendType": "SEQUENTIALLY",
        "events": list(WEBHOOK_EVENTS),
    }
    existing = next(
        (
            hook
            for hook in gateway.list_webhooks()
            if hook.get("url") == settings.ASAAS_WEBHOOK_URL
        ),
        None,
    )
    if existing is not None:
        gateway.update_webhook(str(existing["id"]), payload)
        return str(existing["id"])
    return str(gateway.create_webhook(payload)["id"])
