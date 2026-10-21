from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.billing.errors import BillingRunError
from apps.billing.validators import validate_first_day_of_month
from apps.condominiums.models import Condominium
from apps.core.models.base import BaseModel


@final
class BillingRun(BaseModel):
    """One execution of the monthly issuance for a condominium and a reference month (the audit of the run).

    Running again for the same month is allowed and harmless: units that already have a document are counted.
    """

    class Status(models.TextChoices):
        RUNNING = ("running", "Running")
        SUCCEEDED = ("succeeded", "Succeeded")
        PARTIAL = ("partial", "Partial")
        FAILED = ("failed", "Failed")

    class ProblemCode(models.TextChoices):
        """Why a unit was skipped or failed, or why the whole condominium could not be issued (no unit)."""

        NO_BILLING_RULES = ("no_billing_rules", "No billing rules")
        NO_PLAN_IN_FORCE = ("no_plan_in_force", "No plan in force")
        INCONSISTENT_APPORTIONMENT = ("inconsistent_apportionment", "Inconsistent apportionment")
        UNIT_BILLING_BLOCKED = ("unit_billing_blocked", "Unit billing blocked")
        MANAGER_UNIT_EXEMPT = ("manager_unit_exempt", "Manager unit exempt")
        NO_CURRENT_PAYER = ("no_current_payer", "No current payer")
        NOTHING_TO_BILL = ("nothing_to_bill", "Nothing to bill")
        DOCUMENT_INVALID = ("document_invalid", "Document invalid")

    condominium = models.ForeignKey(Condominium, on_delete=models.PROTECT, related_name="billing_runs")
    reference_month = models.DateField(validators=[validate_first_day_of_month])
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.RUNNING)
    issued_count = models.PositiveIntegerField(default=0)
    already_issued_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    # A list of {"unit": <unit id or null>, "code": <ProblemCode>}.
    problems = models.JSONField(default=list, blank=True)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Billing Run"
        verbose_name_plural = "Billing Runs"
        ordering = ("-started_at",)
        constraints = (
            models.CheckConstraint(
                name="billing_run_finished_not_before_started",
                condition=Q(finished_at__isnull=True) | Q(finished_at__gte=F("started_at")),
                violation_error_message=BillingRunError.FINISHED_BEFORE_STARTED.message,
                violation_error_code=BillingRunError.FINISHED_BEFORE_STARTED.value,
            ),
        )

    @override
    def clean(self) -> None:
        if self.finished_at is not None and self.finished_at < self.started_at:
            raise ValidationError({"finished_at": BillingRunError.FINISHED_BEFORE_STARTED.to_validation_error()})

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.reference_month:%Y-%m} ({self.status})"
