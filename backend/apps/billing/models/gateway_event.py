from typing import final, override

from django.db import models
from django.utils import timezone

from apps.billing.errors import GatewayEventError
from apps.billing.models.gateway_account import GatewayAccount
from apps.core.models.base import BaseModel


@final
class GatewayEvent(BaseModel):
    """An event the gateway sent (or a payment the reconciliation found), kept as received (spec 032).

    The gateway delivers at least once and unordered, so `event_id` is the unique key: a repeat is ignored. The
    payload is never edited. `outcome` says what processing did; `unprocessed` is the queue staff resolves.
    """

    class Outcome(models.TextChoices):
        PENDING = ("pending", "Pending")
        PROCESSED = ("processed", "Processed")
        IGNORED = ("ignored", "Ignored")
        UNPROCESSED = ("unprocessed", "Unprocessed")

    gateway_account = models.ForeignKey(
        GatewayAccount, on_delete=models.PROTECT, related_name="events"
    )
    event_id = models.CharField(max_length=120)
    event_type = models.CharField(max_length=60)
    payload = models.JSONField()
    received_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
    outcome = models.CharField(
        max_length=12, choices=Outcome.choices, default=Outcome.PENDING
    )
    # Why an event is `ignored` or `unprocessed` (a stable code), and the error codes a refused posting gave.
    reason = models.CharField(max_length=60, blank=True)
    error_codes = models.JSONField(default=list, blank=True)

    company_lookup = "gateway_account__company"

    class Meta:
        verbose_name = "Gateway Event"
        verbose_name_plural = "Gateway Events"
        ordering = ("-received_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("event_id",),
                name="gateway_event_unique_event_id",
                violation_error_message=GatewayEventError.EVENT_ID_DUPLICATE.message,
                violation_error_code=GatewayEventError.EVENT_ID_DUPLICATE.value,
            ),
        )
        indexes = (
            models.Index(
                fields=("outcome", "-received_at"), name="gateway_event_outcome_idx"
            ),
        )

    @property
    def payment(self) -> dict[str, object]:
        """The payment object of the payload (empty when the event has none)."""
        payment = (
            self.payload.get("payment") if isinstance(self.payload, dict) else None
        )
        return payment if isinstance(payment, dict) else {}

    @override
    def __str__(self) -> str:
        return f"{self.event_type} {self.event_id} ({self.outcome})"
