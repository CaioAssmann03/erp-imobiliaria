from typing import final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import BillingRulesError
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.validators import validate_due_day
from apps.core.models.base import UUIDModel
from apps.core.validators import validate_percentage


@final
class BillingRules(UUIDModel):
    class CalculationPeriod(models.TextChoices):
        REFERENCE = ("reference", "Reference")
        FOLLOWING = ("following", "Following")

    condominium = models.OneToOneField(
        Condominium, on_delete=models.CASCADE, related_name="billing_rules"
    )

    due_day = models.PositiveSmallIntegerField(
        default=10, validators=[validate_due_day]
    )
    due_on_business_day = models.BooleanField(default=False)

    calculation_period = models.CharField(
        max_length=12,
        choices=CalculationPeriod.choices,
        default=CalculationPeriod.REFERENCE,
    )

    early_payment_discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[validate_percentage]
    )
    early_payment_discount_days = models.PositiveSmallIntegerField(default=0)

    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Billing Rules"
        verbose_name_plural = "Billing Rules"
        constraints = (
            models.CheckConstraint(
                name="billing_due_day_1_28",
                condition=Q(due_day__gte=1) & Q(due_day__lte=28),
                violation_error_message=BillingRulesError.DUE_DAY_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.DUE_DAY_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_discount_pct_0_100",
                condition=Q(early_payment_discount_percentage__gte=0)
                & Q(early_payment_discount_percentage__lte=100),
                violation_error_message=BillingRulesError.DISCOUNT_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.DISCOUNT_OUT_OF_RANGE.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"Billing rules of {self.condominium}"
