import uuid
from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import LateInterestRateError
from apps.billing.models.querysets import LateInterestRateQuerySet
from apps.condominiums.models import Condominium
from apps.core.infrastructure.errors.validators import CoreValidatorError
from apps.core.infrastructure.validators import validate_percentage
from apps.core.models.base import BaseModel


@final
class LateInterestRate(BaseModel):
    """The monthly interest a condominium charges on a late payment, from `start_date` on.

    A condominium keeps a history of rates: the one in force on a date is the one with the latest
    start date not after it. A condominium with no rate charges no interest.
    """

    objects = LateInterestRateQuerySet.as_manager()

    if TYPE_CHECKING:
        condominium_id: uuid.UUID

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="late_interest_rates"
    )
    start_date = models.DateField()
    monthly_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[validate_percentage]
    )

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Late interest rate"
        verbose_name_plural = "Late interest rates"
        ordering = ("-start_date",)
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "start_date"),
                name="billing_late_interest_rate_unique_start_per_condominium",
                violation_error_message=LateInterestRateError.START_DATE_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=LateInterestRateError.START_DATE_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.CheckConstraint(
                name="late_interest_rate_percentage_0_100",
                condition=Q(monthly_percentage__gte=0) & Q(monthly_percentage__lte=100),
                violation_error_message=CoreValidatorError.PERCENTAGE_OUT_OF_RANGE.message,
                violation_error_code=CoreValidatorError.PERCENTAGE_OUT_OF_RANGE.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.monthly_percentage}% a month from {self.start_date} ({self.condominium})"
