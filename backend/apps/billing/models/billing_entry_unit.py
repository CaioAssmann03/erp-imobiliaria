from typing import final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingEntryError
from apps.billing.models.billing_entry import BillingEntry
from apps.billing.models.rules import BillingEntryUnitRules
from apps.condominiums.models import Unit
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.validators import validate_positive_amount


@final
class BillingEntryUnit(BaseModel):
    """A unit selected by a billing entry, with its own amount only when the entry is individual."""

    entry = models.ForeignKey(
        BillingEntry, on_delete=models.CASCADE, related_name="entry_units"
    )
    unit = models.ForeignKey(
        Unit, on_delete=models.PROTECT, related_name="billing_entry_units"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[validate_positive_amount],
    )

    company_lookup = "entry__condominium__company"

    class Meta:
        verbose_name = "Billing Entry Unit"
        verbose_name_plural = "Billing Entry Units"
        ordering = ("entry", "unit__name")
        constraints = (
            models.UniqueConstraint(
                fields=("entry", "unit"),
                name="billing_entry_unit_unique_unit_per_entry",
                violation_error_message=BillingEntryError.UNIT_DUPLICATE_IN_ENTRY.message,
                violation_error_code=BillingEntryError.UNIT_DUPLICATE_IN_ENTRY.value,
            ),
            models.CheckConstraint(
                name="billing_entry_unit_amount_positive",
                condition=Q(amount__isnull=True) | Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
        )

    @override
    def clean(self) -> None:
        BillingEntryUnitRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.entry} - {self.unit}"
