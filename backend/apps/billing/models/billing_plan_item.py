import uuid
from collections.abc import Sequence
from decimal import ROUND_HALF_UP, Decimal
from typing import final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingPlanItemError, BillingValidatorError
from apps.billing.models.billing_plan import BillingPlan
from apps.billing.models.rules import BillingPlanItemRules
from apps.billing.validators import (
    FIRST_IDEAL_FRACTION_NUMBER,
    LAST_IDEAL_FRACTION_NUMBER,
    validate_ideal_fraction_number,
)
from apps.condominiums.models import Unit
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.validators import validate_positive_amount


CENT = Decimal("0.01")


@final
class BillingPlanItem(BaseModel):
    """One line of a plan (the PDF's *ItemPlanoCobranca*): what every unit pays for it and where it is booked."""

    class CalculationKind(models.TextChoices):
        FIXED_AMOUNT = "fixed_amount", "Fixed amount"
        IDEAL_FRACTION_SHARE = "ideal_fraction_share", "Ideal fraction share"
        UNIT_REGISTERED_VALUE = "unit_registered_value", "Unit registered value"

    class UnitValueField(models.TextChoices):
        GAS = "gas", "Gas"
        WATER = "water", "Water"
        ELECTRICITY = "electricity", "Electricity"

    plan = models.ForeignKey(BillingPlan, on_delete=models.CASCADE, related_name="items")
    # Order on the boleto: the order of the list the plan was written with.
    position = models.PositiveSmallIntegerField(default=0)
    description = models.CharField(max_length=120)
    cost_center = models.ForeignKey(
        CostCenter, on_delete=models.PROTECT, related_name="billing_plan_items"
    )
    entry_template = models.ForeignKey(
        EntryTemplate, on_delete=models.PROTECT, related_name="billing_plan_items"
    )
    calculation_kind = models.CharField(max_length=30, choices=CalculationKind.choices)
    # Fixed: what each unit pays. Share: the condominium's total for the month, split by the fraction.
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[validate_positive_amount]
    )
    ideal_fraction_number = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[validate_ideal_fraction_number]
    )
    unit_value_field = models.CharField(
        max_length=20, choices=UnitValueField.choices, null=True, blank=True
    )

    company_lookup = "plan__condominium__company"

    class Meta:
        verbose_name = "Billing Plan Item"
        verbose_name_plural = "Billing Plan Items"
        ordering = ("plan", "position")
        constraints = (
            models.UniqueConstraint(
                fields=("plan", "position"),
                name="billing_plan_item_unique_position_per_plan",
                violation_error_message=BillingPlanItemError.POSITION_DUPLICATE_IN_PLAN.message,
                violation_error_code=BillingPlanItemError.POSITION_DUPLICATE_IN_PLAN.value,
            ),
            models.CheckConstraint(
                name="billing_plan_item_amount_positive",
                condition=Q(amount__isnull=True) | Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="billing_plan_item_ideal_fraction_number_1_6",
                condition=Q(ideal_fraction_number__isnull=True)
                | Q(
                    ideal_fraction_number__gte=FIRST_IDEAL_FRACTION_NUMBER,
                    ideal_fraction_number__lte=LAST_IDEAL_FRACTION_NUMBER,
                ),
                violation_error_message=BillingValidatorError.IDEAL_FRACTION_NUMBER_OUT_OF_RANGE.message,
                violation_error_code=BillingValidatorError.IDEAL_FRACTION_NUMBER_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_plan_item_amount_matches_kind",
                condition=Q(calculation_kind="unit_registered_value", amount__isnull=True)
                | (~Q(calculation_kind="unit_registered_value") & Q(amount__isnull=False)),
                violation_error_message=BillingPlanItemError.AMOUNT_DOES_NOT_MATCH_KIND.message,
                violation_error_code=BillingPlanItemError.AMOUNT_DOES_NOT_MATCH_KIND.value,
            ),
            models.CheckConstraint(
                name="billing_plan_item_fraction_matches_kind",
                condition=Q(calculation_kind="ideal_fraction_share", ideal_fraction_number__isnull=False)
                | (~Q(calculation_kind="ideal_fraction_share") & Q(ideal_fraction_number__isnull=True)),
                violation_error_message=BillingPlanItemError.IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_KIND.message,
                violation_error_code=BillingPlanItemError.IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_KIND.value,
            ),
            models.CheckConstraint(
                name="billing_plan_item_unit_value_field_matches_kind",
                condition=Q(calculation_kind="unit_registered_value", unit_value_field__isnull=False)
                | (~Q(calculation_kind="unit_registered_value") & Q(unit_value_field__isnull=True)),
                violation_error_message=BillingPlanItemError.UNIT_VALUE_FIELD_DOES_NOT_MATCH_KIND.message,
                violation_error_code=BillingPlanItemError.UNIT_VALUE_FIELD_DOES_NOT_MATCH_KIND.value,
            ),
        )

    @override
    def clean(self) -> None:
        BillingPlanItemRules(self).validate()

    def uses_inconsistent_apportionment(self, apportionment_totals: Sequence[Decimal]) -> bool:
        """Whether a share item names a fraction that does not close at 1 over the active units
        (`Unit.objects.apportionment_totals()`); the other kinds never do. A fraction no unit has yet counts."""
        if self.calculation_kind != self.CalculationKind.IDEAL_FRACTION_SHARE:
            return False
        assert self.ideal_fraction_number is not None
        total = apportionment_totals[self.ideal_fraction_number - 1]
        return abs(total - Unit.APPORTIONMENT_TOTAL) > Unit.APPORTIONMENT_TOLERANCE

    def amounts_by_unit(self, units: Sequence[Unit]) -> dict[uuid.UUID, Decimal]:
        """What each unit pays for this line; zero when it owes nothing for it.

        `units` must be all the active units of the plan's condominium: a share is split among them, so
        the shares of the whole list add up exactly to the total (a unit that is not billed leaves its share
        uncharged).
        """
        if self.calculation_kind == self.CalculationKind.FIXED_AMOUNT:
            assert self.amount is not None
            return {unit.pk: self.amount for unit in units}
        if self.calculation_kind == self.CalculationKind.UNIT_REGISTERED_VALUE:
            return {unit.pk: getattr(unit, f"{self.unit_value_field}_value") for unit in units}
        return self._share_amounts(units)

    def _share_amounts(self, units: Sequence[Unit]) -> dict[uuid.UUID, Decimal]:
        """The total split by the named fraction, each share rounded half-up to the cent; the leftover cents
        go to the unit with the largest fraction (then by name) so a rerun gives the same amounts."""
        assert self.amount is not None and self.ideal_fraction_number is not None
        fraction_field = Unit.IDEAL_FRACTION_FIELDS[self.ideal_fraction_number - 1]
        fractions = {unit.pk: getattr(unit, fraction_field) or Decimal(0) for unit in units}
        shares = {
            unit_id: (self.amount * fraction).quantize(CENT, rounding=ROUND_HALF_UP)
            for unit_id, fraction in fractions.items()
        }
        leftover = self.amount - sum(shares.values(), Decimal(0))
        if leftover and any(fractions.values()):
            largest = min(units, key=lambda unit: (-fractions[unit.pk], unit.name, str(unit.pk)))
            shares[largest.pk] += leftover
        return shares

    @override
    def __str__(self) -> str:
        return self.description
