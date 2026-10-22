import json
from typing import Any, final

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..gateway.svix_signature import verify_svix_signature
from ..models import BillingDocumentDelivery

# Resend event -> what it means for the delivery. `delivered` only moves a `sent` delivery; a bounce or complaint fails it.
DELIVERED_EVENT = "email.delivered"
FAILURE_EVENTS = {"email.bounced": "bounced", "email.complained": "complained"}


@final
@extend_schema(exclude=True)
class ResendWebhookView(APIView):
    """Resend reports what became of each e-mail (spec 035): authenticated by the Svix signature, never by a JWT."""

    authentication_classes: list[Any] = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        meta = request.META
        if not verify_svix_signature(
            settings.RESEND_WEBHOOK_SECRET,
            meta.get("HTTP_SVIX_ID", ""),
            meta.get("HTTP_SVIX_TIMESTAMP", ""),
            meta.get("HTTP_SVIX_SIGNATURE", ""),
            request.body,
        ):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(request.body)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        event_type = payload.get("type") if isinstance(payload, dict) else None
        data = payload.get("data") if isinstance(payload, dict) else None
        message_id = data.get("email_id") if isinstance(data, dict) else None
        if isinstance(event_type, str) and isinstance(message_id, str):
            _apply(event_type, message_id)
        return Response(status=status.HTTP_200_OK)


def _apply(event_type: str, message_id: str) -> None:
    deliveries = BillingDocumentDelivery.objects.filter(provider_message_id=message_id)
    if event_type == DELIVERED_EVENT:
        _ = deliveries.filter(status=BillingDocumentDelivery.Status.SENT).update(
            status=BillingDocumentDelivery.Status.DELIVERED
        )
    elif event_type in FAILURE_EVENTS:
        _ = deliveries.exclude(status=BillingDocumentDelivery.Status.FAILED).update(
            status=BillingDocumentDelivery.Status.FAILED, failure_reason=FAILURE_EVENTS[event_type]
        )
