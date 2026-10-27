from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.billing.errors import GatewayReconciliationRunError
from apps.billing.models.gateway_account import GatewayAccount
from apps.core.models.base import BaseModel


@final
class GatewayReconciliationRun(BaseModel):
    """One comparison of what the gateway received with what was posted, for an account and a window (spec 033)."""

    class Status(models.TextChoices):
        RUNNING = ("running", "Running")
        SUCCEEDED = ("succeeded", "Succeeded")
        FAILED = ("failed", "Failed")

    gateway_account = models.ForeignKey(
        GatewayAccount, on_delete=models.PROTECT, related_name="reconciliation_runs"
    )
    window_start = models.DateField()
    window_end = models.DateField()
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.RUNNING
    )
    found_count = models.PositiveIntegerField(default=0)
    already_posted_count = models.PositiveIntegerField(default=0)
    processed_count = models.PositiveIntegerField(default=0)
    unprocessed_count = models.PositiveIntegerField(default=0)
    # The stable code of the gateway error that stopped the run (never a message with a credential).
    error_code = models.CharField(max_length=80, blank=True)
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)

    company_lookup = "gateway_account__condominium__company"

    class Meta:
        verbose_name = "Gateway Reconciliation Run"
        verbose_name_plural = "Gateway Reconciliation Runs"
        ordering = ("-started_at",)
        constraints = (
            models.CheckConstraint(
                name="gateway_reconciliation_run_window_ordered",
                condition=Q(window_end__gte=F("window_start")),
                violation_error_message=GatewayReconciliationRunError.WINDOW_INVERTED.message,
                violation_error_code=GatewayReconciliationRunError.WINDOW_INVERTED.value,
            ),
            models.CheckConstraint(
                name="gateway_reconciliation_run_finished_not_before_started",
                condition=Q(finished_at__isnull=True)
                | Q(finished_at__gte=F("started_at")),
                violation_error_message=GatewayReconciliationRunError.FINISHED_BEFORE_STARTED.message,
                violation_error_code=GatewayReconciliationRunError.FINISHED_BEFORE_STARTED.value,
            ),
        )

    @override
    def clean(self) -> None:
        if self.window_end < self.window_start:
            raise ValidationError(
                {
                    "window_end": GatewayReconciliationRunError.WINDOW_INVERTED.to_validation_error()
                }
            )
        if self.finished_at is not None and self.finished_at < self.started_at:
            raise ValidationError(
                {
                    "finished_at": GatewayReconciliationRunError.FINISHED_BEFORE_STARTED.to_validation_error()
                }
            )

    @override
    def __str__(self) -> str:
        return f"{self.gateway_account} {self.window_start}..{self.window_end} ({self.status})"
