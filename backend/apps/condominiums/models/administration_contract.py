import uuid
from datetime import date
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.errors import AdministrationContractError
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.querysets import AdministrationContractQuerySet
from apps.condominiums.models.rules import AdministrationContractRules
from apps.core.dates import add_months
from apps.core.models.base import UUIDModel


@final
class AdministrationContract(UUIDModel):
    objects = AdministrationContractQuerySet.as_manager()

    class FeeType(models.TextChoices):
        FIXED = "fixed", "Fixed"
        VARIABLE = "variable", "Variable"

    class FeeBasis(models.TextChoices):
        REVENUE = "revenue", "Revenue"
        EXPENSE = "expense", "Expense"

    if TYPE_CHECKING:
        condominium_id: uuid.UUID

    condominium = models.OneToOneField(
        Condominium, on_delete=models.CASCADE, related_name="administration_contract"
    )
    start_date = models.DateField(blank=True, null=True)

    fee_type = models.CharField(
        max_length=10, choices=FeeType.choices, default=FeeType.FIXED
    )
    fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )
    fee_basis = models.CharField(
        max_length=10, choices=FeeBasis.choices, blank=True, null=True
    )
    fee_floor = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    fee_ceiling = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    charges_iss_on_fee = models.BooleanField(default=False)

    adjustment_base_date = models.DateField(blank=True, null=True)
    adjustment_period_months = models.PositiveSmallIntegerField(default=12)
    adjustment_index = models.CharField(
        max_length=30, blank=True, default="", help_text="Ex: IGPM, INCC"
    )

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Administration contract"
        verbose_name_plural = "Administration contracts"
        constraints = (
            models.CheckConstraint(
                name="contract_fixed_needs_amount",
                condition=~Q(fee_type="fixed") | Q(fee_amount__isnull=False),
                violation_error_message=AdministrationContractError.FEE_AMOUNT_REQUIRED_FOR_FIXED.message,
                violation_error_code=AdministrationContractError.FEE_AMOUNT_REQUIRED_FOR_FIXED.value,
            ),
            models.CheckConstraint(
                name="contract_variable_needs_pct_basis",
                condition=~Q(fee_type="variable")
                | (Q(fee_percentage__isnull=False) & Q(fee_basis__isnull=False)),
                violation_error_message=AdministrationContractError.VARIABLE_FEE_INCOMPLETE.message,
                violation_error_code=AdministrationContractError.VARIABLE_FEE_INCOMPLETE.value,
            ),
            models.CheckConstraint(
                name="contract_floor_lte_ceiling",
                condition=Q(fee_floor__isnull=True)
                | Q(fee_ceiling__isnull=True)
                | Q(fee_floor__lte=F("fee_ceiling")),
                violation_error_message=AdministrationContractError.FEE_FLOOR_EXCEEDS_CEILING.message,
                violation_error_code=AdministrationContractError.FEE_FLOOR_EXCEEDS_CEILING.value,
            ),
        )

    @override
    def clean(self) -> None:
        """Also guarded by the check constraints above."""
        AdministrationContractRules(self).validate()

    def next_adjustment_date(self) -> date | None:
        if self.adjustment_base_date is None:
            return None
        return add_months(self.adjustment_base_date, self.adjustment_period_months)

    def is_adjustment_overdue(self, reference_date: date) -> bool:
        next_date = self.next_adjustment_date()
        return next_date is not None and next_date < reference_date

    @override
    def __str__(self) -> str:
        return f"Contract of {self.condominium}"
