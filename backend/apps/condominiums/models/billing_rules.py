import uuid

from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.condominiums.models.condominium import Condominium


@final
class BillingRules(models.Model):
    class CalculationPeriod(models.TextChoices):
        REFERENCE = ("reference", "Reference")
        FOLLOWING = ("following", "Following")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    condominium = models.OneToOneField(
        Condominium, on_delete=models.CASCADE, related_name="billing_rules"
    )

    due_day = models.PositiveSmallIntegerField(default=10)
    due_on_business_day = models.BooleanField(default=False)

    calculation_period = models.CharField(
        max_length=12, choices=CalculationPeriod.choices, default=CalculationPeriod.REFERENCE
    )

    early_payment_discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    early_payment_discount_days = models.PositiveSmallIntegerField(default=0)

    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Billing Rules"
        verbose_name_plural = "Billing Rules"
        constraints = (
            models.CheckConstraint(
                name="billing_due_day_1_28",
                condition=Q(due_day__gte=1) & Q(due_day__lte=28),
                violation_error_message="Due day must be between 1 and 28",
            ),
            models.CheckConstraint(
                name="billing_discount_pct_0_100",
                condition=Q(early_payment_discount_percentage__gte=0)
                & Q(early_payment_discount_percentage__lte=100),
                violation_error_message="Discount must be between 0 and 100",
            ),
        )

    @override
    def __str__(self) -> str:
        return f"Billing rules of {self.condominium}"
