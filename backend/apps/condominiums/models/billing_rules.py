from datetime import date, timedelta
from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import BillingRulesError
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.rules import BillingRulesRules
from apps.condominiums.validators import (
    MAX_LATE_FEE_PERCENTAGE,
    validate_due_day,
    validate_issuance_day,
    validate_initial_late_fee_days,
    validate_late_fee_percentage,
)
from apps.core.dates import add_months
from apps.core.models.base import UUIDModel
from apps.core.validators import validate_percentage

if TYPE_CHECKING:
    from apps.condominiums.models.unit import Unit


SATURDAY = 5  # date.weekday(): Monday is 0


@final
class BillingRules(UUIDModel):
    class DueMonth(models.TextChoices):
        """Where the due date falls, from the reference month the issuance refers to."""

        REFERENCE = ("reference", "Reference")
        FOLLOWING = ("following", "Following")

    class CompetenceMonth(models.TextChoices):
        """Which month the boleto accounts for, from its due month."""

        SAME_AS_DUE = ("same_as_due", "Same as due")
        BEFORE_DUE = ("before_due", "Before due")

    class InterestCalculation(models.TextChoices):
        """How the late interest is counted: the whole month's rate, or the rate ÷ 30 per day late."""

        FULL_MONTH = ("full_month", "Full month")
        PER_DAY = ("per_day", "Per day")

    condominium = models.OneToOneField(
        Condominium, on_delete=models.CASCADE, related_name="billing_rules"
    )

    due_day = models.PositiveSmallIntegerField(
        default=10, validators=[validate_due_day]
    )
    due_on_business_day = models.BooleanField(default=False)

    # Day of the month the monthly issuance runs for this condominium.
    issuance_day = models.PositiveSmallIntegerField(
        default=1, db_default=1, validators=[validate_issuance_day]
    )
    # The manager unit (the syndic's) is left out of the monthly issuance.
    exempts_manager_unit = models.BooleanField(default=False, db_default=False)

    # The column keeps the name it had as `calculation_period`, so a container that still runs the
    # old code keeps working while a deploy replaces the containers.
    due_month = models.CharField(
        max_length=12,
        choices=DueMonth.choices,
        default=DueMonth.REFERENCE,
        db_column="calculation_period",
    )
    competence_month = models.CharField(
        max_length=12,
        choices=CompetenceMonth.choices,
        default=CompetenceMonth.SAME_AS_DUE,
        db_default=CompetenceMonth.SAME_AS_DUE,
    )

    early_payment_discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[validate_percentage]
    )
    early_payment_discount_days = models.PositiveSmallIntegerField(default=0)

    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Fine on a late payment: `late_fee_percentage`, or `initial_late_fee_percentage` when the payment
    # comes within the first `initial_late_fee_days` days of delay (both empty: no first-days tier).
    late_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        db_default=0,
        validators=[validate_late_fee_percentage],
    )
    initial_late_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[validate_late_fee_percentage],
    )
    initial_late_fee_days = models.PositiveSmallIntegerField(
        blank=True, null=True, validators=[validate_initial_late_fee_days]
    )

    # The rates themselves are `LateInterestRate` (by start date); a condominium with none charges no interest.
    interest_calculation = models.CharField(
        max_length=12,
        choices=InterestCalculation.choices,
        default=InterestCalculation.FULL_MONTH,
        db_default=InterestCalculation.FULL_MONTH,
    )
    interest_grace_days = models.PositiveSmallIntegerField(default=0, db_default=0)

    should_show_qr_code = models.BooleanField(default=False, db_default=False)
    should_show_fee_statement = models.BooleanField(default=False, db_default=False)

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
                name="billing_issuance_day_1_28",
                condition=Q(issuance_day__gte=1) & Q(issuance_day__lte=28),
                violation_error_message=BillingRulesError.ISSUANCE_DAY_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.ISSUANCE_DAY_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_discount_pct_0_100",
                condition=Q(early_payment_discount_percentage__gte=0)
                & Q(early_payment_discount_percentage__lte=100),
                violation_error_message=BillingRulesError.DISCOUNT_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.DISCOUNT_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_late_fee_0_2",
                condition=Q(late_fee_percentage__gte=0)
                & Q(late_fee_percentage__lte=MAX_LATE_FEE_PERCENTAGE),
                violation_error_message=BillingRulesError.LATE_FEE_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.LATE_FEE_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_initial_late_fee_0_2",
                condition=Q(initial_late_fee_percentage__isnull=True)
                | (
                    Q(initial_late_fee_percentage__gte=0)
                    & Q(initial_late_fee_percentage__lte=MAX_LATE_FEE_PERCENTAGE)
                ),
                violation_error_message=BillingRulesError.LATE_FEE_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.LATE_FEE_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_initial_late_fee_days_min_1",
                condition=Q(initial_late_fee_days__isnull=True)
                | Q(initial_late_fee_days__gte=1),
                violation_error_message=BillingRulesError.INITIAL_LATE_FEE_DAYS_OUT_OF_RANGE.message,
                violation_error_code=BillingRulesError.INITIAL_LATE_FEE_DAYS_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_initial_late_fee_all_or_none",
                condition=Q(
                    initial_late_fee_percentage__isnull=True,
                    initial_late_fee_days__isnull=True,
                )
                | Q(
                    initial_late_fee_percentage__isnull=False,
                    initial_late_fee_days__isnull=False,
                ),
                violation_error_message=BillingRulesError.INITIAL_LATE_FEE_INCOMPLETE.message,
                violation_error_code=BillingRulesError.INITIAL_LATE_FEE_INCOMPLETE.value,
            ),
        )

    @override
    def clean(self) -> None:
        """Also guarded by the check constraints above."""
        BillingRulesRules(self).validate()

    def due_month_of(self, reference_month: date) -> date:
        """First day of the month the boleto falls due in, for the month the issuance refers to."""
        months_after_reference = 1 if self.due_month == self.DueMonth.FOLLOWING else 0
        return add_months(reference_month.replace(day=1), months_after_reference)

    def competence_month_of(self, reference_month: date) -> date:
        """First day of the month the boleto accounts for, for the month the issuance refers to."""
        months_before_due = 1 if self.competence_month == self.CompetenceMonth.BEFORE_DUE else 0
        return add_months(self.due_month_of(reference_month), -months_before_due)

    def exempts(self, unit: "Unit") -> bool:
        """Whether the monthly issuance leaves the unit out because it is the exempt manager unit."""
        return self.exempts_manager_unit and unit.is_manager_unit

    def due_date_of(self, reference_month: date) -> date:
        """The due date for the month the issuance refers to: `due_day` of the due month, moved from a
        Saturday or Sunday to the next Monday when `due_on_business_day` (national holidays are not considered)."""
        due_date = self.due_month_of(reference_month).replace(day=self.due_day)
        if self.due_on_business_day and due_date.weekday() >= SATURDAY:
            due_date += timedelta(days=7 - due_date.weekday())
        return due_date

    @override
    def __str__(self) -> str:
        return f"Billing rules of {self.condominium}"
