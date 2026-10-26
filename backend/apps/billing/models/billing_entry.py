import uuid
from collections.abc import Sequence
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import TYPE_CHECKING, Any, final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingEntryError, BillingValidatorError
from apps.billing.models.billing_event import BillingEvent
from apps.billing.models.querysets import BillingEntryQuerySet
from apps.billing.models.rules import BillingEntryRules
from apps.billing.validators import (
    FIRST_IDEAL_FRACTION_NUMBER,
    LAST_IDEAL_FRACTION_NUMBER,
    validate_first_day_of_month,
    validate_ideal_fraction_number,
)
from apps.condominiums.models import Condominium, Unit
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.validators import validate_positive_amount

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .billing_document_item import BillingDocumentItem
    from .billing_entry_unit import BillingEntryUnit

CENT = Decimal("0.01")
LINE_DESCRIPTION_MAX_LENGTH = 120
MONTHS_PER_YEAR = 12


@final
class BillingEntry(BaseModel):
    """A value launched for a condominium's boletos besides the fixed plan (the *Inclusão de valores* screen, spec 039).

    It covers one month, a number of installments or every month until it is ended, for the units it selects.
    Once a document was issued from it, it is frozen: it can only be ended.
    """

    class Allocation(models.TextChoices):
        INDIVIDUAL = ("individual", "Individual")
        COLLECTIVE = ("collective", "Collective")
        FRACTION = ("fraction", "Fraction")

    class Recurrence(models.TextChoices):
        ONCE = ("once", "Once")
        INSTALLMENTS = ("installments", "Installments")
        ALWAYS = ("always", "Always")

    if TYPE_CHECKING:
        entry_units: "RelatedManager[BillingEntryUnit]"
        document_items: "RelatedManager[BillingDocumentItem]"

    objects = BillingEntryQuerySet.as_manager()

    condominium = models.ForeignKey(Condominium, on_delete=models.PROTECT, related_name="billing_entries")
    event = models.ForeignKey(BillingEvent, on_delete=models.PROTECT, null=True, blank=True, related_name="entries")
    description = models.CharField(max_length=120, blank=True)
    allocation = models.CharField(max_length=12, choices=Allocation.choices)
    ideal_fraction_number = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[validate_ideal_fraction_number]
    )
    recurrence = models.CharField(max_length=12, choices=Recurrence.choices)
    installments_total = models.PositiveSmallIntegerField(null=True, blank=True)
    start_month = models.DateField(validators=[validate_first_day_of_month])
    end_month = models.DateField(null=True, blank=True, validators=[validate_first_day_of_month])
    cost_center = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name="billing_entries")
    # Chosen from the cost center when the entry is saved: its only active template (`BillingEntryRules`).
    entry_template = models.ForeignKey(
        EntryTemplate, on_delete=models.PROTECT, null=True, blank=True, related_name="billing_entries"
    )
    # Individual: what each unit pays. Collective and fraction: the total split among the selected units.
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[validate_positive_amount])

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Billing Entry"
        verbose_name_plural = "Billing Entries"
        ordering = ("-start_month", "created_at")
        constraints = (
            models.CheckConstraint(
                name="billing_entry_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="billing_entry_ideal_fraction_number_1_6",
                condition=Q(ideal_fraction_number__isnull=True)
                | Q(
                    ideal_fraction_number__gte=FIRST_IDEAL_FRACTION_NUMBER,
                    ideal_fraction_number__lte=LAST_IDEAL_FRACTION_NUMBER,
                ),
                violation_error_message=BillingValidatorError.IDEAL_FRACTION_NUMBER_OUT_OF_RANGE.message,
                violation_error_code=BillingValidatorError.IDEAL_FRACTION_NUMBER_OUT_OF_RANGE.value,
            ),
            models.CheckConstraint(
                name="billing_entry_fraction_matches_allocation",
                condition=Q(allocation="fraction", ideal_fraction_number__isnull=False)
                | (~Q(allocation="fraction") & Q(ideal_fraction_number__isnull=True)),
                violation_error_message=BillingEntryError.IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_ALLOCATION.message,
                violation_error_code=BillingEntryError.IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_ALLOCATION.value,
            ),
            models.CheckConstraint(
                name="billing_entry_installments_match_recurrence",
                condition=Q(recurrence="installments", installments_total__gte=2)
                | (~Q(recurrence="installments") & Q(installments_total__isnull=True)),
                violation_error_message=BillingEntryError.INSTALLMENTS_TOTAL_DOES_NOT_MATCH_RECURRENCE.message,
                violation_error_code=BillingEntryError.INSTALLMENTS_TOTAL_DOES_NOT_MATCH_RECURRENCE.value,
            ),
            models.CheckConstraint(
                name="billing_entry_end_month_only_for_always",
                condition=Q(end_month__isnull=True) | Q(recurrence="always"),
                violation_error_message=BillingEntryError.END_MONTH_ONLY_FOR_ALWAYS.message,
                violation_error_code=BillingEntryError.END_MONTH_ONLY_FOR_ALWAYS.value,
            ),
        )

    @override
    def clean(self) -> None:
        BillingEntryRules(self).validate()

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.is_used():
            raise BillingEntryError.ALREADY_USED.to_validation_error()
        return super().delete(*args, **kwargs)

    def assert_unchanged_by_units(self) -> None:
        """The selection of a used entry cannot change either: it would rewrite what was issued."""
        if self.is_used():
            raise BillingEntryError.ALREADY_USED.to_validation_error()

    def is_used(self) -> bool:
        """Whether a document was issued from this entry: from then on it is frozen."""
        return not self._state.adding and self.document_items.exists()

    def covers(self, reference_month: date) -> bool:
        """Whether the boleto of this month carries the entry (`BillingEntryQuerySet.in_force` for many)."""
        month = reference_month.replace(day=1)
        index = self.month_index(month)
        if index < 0:
            return False
        if self.recurrence == self.Recurrence.ONCE:
            return index == 0
        if self.recurrence == self.Recurrence.INSTALLMENTS:
            assert self.installments_total is not None
            return index < self.installments_total
        return self.end_month is None or self.end_month >= month

    def month_index(self, reference_month: date) -> int:
        """Months from the start month to the reference month (0 is the first one, negative is before it)."""
        return (reference_month.year - self.start_month.year) * MONTHS_PER_YEAR + (
            reference_month.month - self.start_month.month
        )

    def installment_label(self, reference_month: date) -> str:
        """`k/n` for an installment entry in this month, empty for the others."""
        if self.recurrence != self.Recurrence.INSTALLMENTS:
            return ""
        return f"{self.month_index(reference_month.replace(day=1)) + 1}/{self.installments_total}"

    def line_description(self, reference_month: date) -> str:
        """What the boleto line says: the event name and the description, and the installment when there is one."""
        parts = [self.event.name if self.event is not None else "", self.description]
        text = " - ".join(part for part in parts if part)
        label = self.installment_label(reference_month)
        text = f"{text} ({label})" if label and text else text or label
        return text[:LINE_DESCRIPTION_MAX_LENGTH]

    def amounts_by_unit(self, units: Sequence[Unit], overrides: dict[uuid.UUID, Decimal] | None = None) -> dict[uuid.UUID, Decimal]:
        """What each of the selected `units` pays for this entry.

        Individual: the entry's amount (or the unit's own override). Collective: the total split equally. Fraction: the
        total split in proportion to the unit's ideal fraction. A split is rounded half-up to the cent and the
        leftover cents go to one unit (the first by name, or the largest fraction) so the parts add up to the total.
        """
        if self.allocation == self.Allocation.INDIVIDUAL:
            given = overrides or {}
            return {unit.pk: given.get(unit.pk, self.amount) for unit in units}
        if self.allocation == self.Allocation.COLLECTIVE:
            weights = {unit.pk: Decimal(1) for unit in units}
        else:
            weights = {unit.pk: self.ideal_fraction_of(unit) for unit in units}
        return self._split(units, weights)

    def ideal_fraction_of(self, unit: Unit) -> Decimal:
        assert self.ideal_fraction_number is not None
        return getattr(unit, Unit.IDEAL_FRACTION_FIELDS[self.ideal_fraction_number - 1]) or Decimal(0)

    def _split(self, units: Sequence[Unit], weights: dict[uuid.UUID, Decimal]) -> dict[uuid.UUID, Decimal]:
        total_weight = sum(weights.values(), Decimal(0))
        if not units or total_weight <= 0:
            return {unit.pk: Decimal(0) for unit in units}
        shares = {
            unit_id: (self.amount * weight / total_weight).quantize(CENT, rounding=ROUND_HALF_UP)
            for unit_id, weight in weights.items()
        }
        leftover = self.amount - sum(shares.values(), Decimal(0))
        if leftover:
            first = min(units, key=lambda unit: (-weights[unit.pk], unit.name, str(unit.pk)))
            shares[first.pk] += leftover
        return shares

    @override
    def __str__(self) -> str:
        return self.line_description(self.start_month) or str(self.pk)
