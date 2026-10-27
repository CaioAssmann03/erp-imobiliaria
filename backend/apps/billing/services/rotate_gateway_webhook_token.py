import secrets

from django.db import transaction

from apps.billing.models import GatewayAccount


def rotate_gateway_webhook_token(account: GatewayAccount) -> GatewayAccount:
    """Replace the webhook token; the gateway must be told the new one (`register_gateway_webhook`), or its events are refused."""
    with transaction.atomic():
        locked = GatewayAccount.objects.select_for_update().get(pk=account.pk)
        locked.webhook_token = secrets.token_urlsafe(32)
        locked.save()
    account.refresh_from_db()
    return account
