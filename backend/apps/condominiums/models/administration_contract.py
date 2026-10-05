import uuid
from typing import TYPE_CHECKING

from collections.abc import Callable
from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.error_codes import CondominiumsErrorCode as Code

from apps.condominiums.models.condominium import Condominium
from apps.core.dates import add_months


FIXED_FEE_NEEDS_AMOUNT = "Fixed fee requires an amount."
VARIABLE_FEE_NEEDS_PERCENTAGE_AND_BASIS = "Variable fee requires percentage and basis."
FLOOR_EXCEEDS_CEILING = "Floor cannot exceed ceiling."


ADJUSTMENT_ALERT_DAYS = 30  # days: window of the "adjustment coming up" pendency


class AdministrationContractQuerySet(models.QuerySet["AdministrationContract"]):
    def _adjustment_condominium_ids(
        self, is_wanted: Callable[[date], bool]
    ) -> list[uuid.UUID]:
        contracts = self.filter(condominium__active=True, adjustment_base_date__isnull=False)
        ids: list[uuid.UUID] = []
        for contract in contracts:
            next_date = contract.next_adjustment_date()
            if next_date is not None and is_wanted(next_date):
                ids.append(contract.condominium_id)
        return ids

    def overdue_adjustment_condominium_ids(self, reference_date: date) -> list[uuid.UUID]:
        """Active condominiums whose next adjustment date has already passed."""
        return self._adjustment_condominium_ids(lambda next_date: next_date < reference_date)

    def upcoming_adjustment_condominium_ids(self, reference_date: date) -> list[uuid.UUID]:
        """Active condominiums whose next adjustment falls within the next 30 days."""
        window_end = reference_date + timedelta(days=ADJUSTMENT_ALERT_DAYS)
        return self._adjustment_condominium_ids(
            lambda next_date: reference_date <= next_date <= window_end
        )


@final
class AdministrationContract(models.Model):
    objects = AdministrationContractQuerySet.as_manager()

    class FeeType(models.TextChoices):
        FIXED = "fixed", "Fixed"
        VARIABLE = "variable", "Variable"

    class FeeBasis(models.TextChoices):
        REVENUE = "revenue", "Revenue"
        EXPENSE = "expense", "Expense"

    if TYPE_CHECKING:
        condominium_id: uuid.UUID

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Administration contract"
        verbose_name_plural = "Administration contracts"
        constraints = (
            # If type != fixed -> True
            # If fee_amount != null -> True
            # else: Error message
            models.CheckConstraint(
                name="contract_fixed_needs_amount",
                condition=~Q(fee_type="fixed") | Q(fee_amount__isnull=False),
                violation_error_message=FIXED_FEE_NEEDS_AMOUNT,
                violation_error_code=Code.CONTRACT_FEE_AMOUNT_REQUIRED_FOR_FIXED.value,
            ),
            models.CheckConstraint(
                name="contract_variable_needs_pct_basis",
                condition=~Q(fee_type="variable")
                | (Q(fee_percentage__isnull=False) & Q(fee_basis__isnull=False)),
                violation_error_message=VARIABLE_FEE_NEEDS_PERCENTAGE_AND_BASIS,
                violation_error_code=Code.CONTRACT_VARIABLE_FEE_INCOMPLETE.value,
            ),
            models.CheckConstraint(
                name="contract_floor_lte_ceiling",
                condition=Q(fee_floor__isnull=True)
                | Q(fee_ceiling__isnull=True)
                | Q(fee_floor__lte=F("fee_ceiling")),
                violation_error_message=FLOOR_EXCEEDS_CEILING,
                violation_error_code=Code.CONTRACT_FEE_FLOOR_EXCEEDS_CEILING.value,
            ),
        )

    @override
    def clean(self) -> None:
        """Fee rules (also guarded by the check constraints above)."""
        errors: dict[str, ValidationError] = {}
        if self.fee_type == self.FeeType.FIXED and self.fee_amount is None:
            errors["fee_amount"] = ValidationError(
                FIXED_FEE_NEEDS_AMOUNT, code=Code.CONTRACT_FEE_AMOUNT_REQUIRED_FOR_FIXED.value
            )
        if self.fee_type == self.FeeType.VARIABLE:
            if self.fee_percentage is None:
                errors["fee_percentage"] = ValidationError(
                    VARIABLE_FEE_NEEDS_PERCENTAGE_AND_BASIS,
                    code=Code.CONTRACT_VARIABLE_FEE_INCOMPLETE.value,
                )
            if not self.fee_basis:
                errors["fee_basis"] = ValidationError(
                    VARIABLE_FEE_NEEDS_PERCENTAGE_AND_BASIS,
                    code=Code.CONTRACT_VARIABLE_FEE_INCOMPLETE.value,
                )
        if (
            self.fee_floor is not None
            and self.fee_ceiling is not None
            and self.fee_floor > self.fee_ceiling
        ):
            errors["fee_floor"] = ValidationError(
                FLOOR_EXCEEDS_CEILING, code=Code.CONTRACT_FEE_FLOOR_EXCEEDS_CEILING.value
            )
        if errors:
            raise ValidationError(errors)

    def next_adjustment_date(self) -> date | None:
        """Next adjustment: base date plus the adjustment period (None without a base date)."""
        if self.adjustment_base_date is None:
            return None
        return add_months(self.adjustment_base_date, self.adjustment_period_months)

    def is_adjustment_overdue(self, reference_date: date) -> bool:
        next_date = self.next_adjustment_date()
        return next_date is not None and next_date < reference_date

    @override
    def __str__(self) -> str:
        return f"Contract of {self.condominium}"
