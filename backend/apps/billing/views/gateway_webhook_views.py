import hmac
import json
from typing import Any, final

from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import GatewayAccount, GatewayEvent
from ..tasks import process_gateway_event_task

TOKEN_HEADER = "HTTP_ASAAS_ACCESS_TOKEN"


@final
@extend_schema(exclude=True)
class AsaasWebhookView(APIView):
    """Asaas posts its events here (spec 032): authenticated by the account's `authToken`, stored first, processed later.

    No JWT: the gateway cannot log in. The body is trusted for nothing but being stored; the answer is 200 as soon as the
    event is saved (a repeat too), so the gateway's queue is never paused by a slow endpoint.
    """

    authentication_classes: list[Any] = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        account = _account_of_token(request.META.get(TOKEN_HEADER, ""))
        if account is None:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        payload = request.data
        if not isinstance(payload, dict):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        event_id, event_type = payload.get("id"), payload.get("event")
        if not isinstance(event_id, str) or not isinstance(event_type, str):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                event = GatewayEvent.objects.create(
                    gateway_account=account, event_id=event_id, event_type=event_type, payload=json.loads(json.dumps(payload))
                )
                transaction.on_commit(lambda: process_gateway_event_task.delay(str(event.pk)))
        except IntegrityError:
            pass  # already received: the gateway delivers at least once
        return Response(status=status.HTTP_200_OK)


def _account_of_token(token: str) -> GatewayAccount | None:
    """The account whose webhook token this is; tokens are encrypted, so they are compared one by one in constant time."""
    if not token:
        return None
    for account in GatewayAccount.objects.all():
        if hmac.compare_digest(account.webhook_token.encode(), token.encode()):
            return account
    return None
