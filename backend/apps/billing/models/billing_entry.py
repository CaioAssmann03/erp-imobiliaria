import uuid
from collections.abc import Sequence
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import TYPE_CHECKING, Any, final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingEntryError
from apps.billing.models.billing_event import BillingEvent
from apps.billing.models.querysets import BillingEntryQuerySet
from apps.billing.models.rules import BillingEntryRules
from apps.condominiums.models import (
    Condominium,
    CondominiumApportionmentCriterion,
    Unit,
    UnitApportionmentFraction,
)
from apps.core.infrastructure.validators import validate_first_day_of_month
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.validators import validate_non_zero_amount

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .billing_document_item import BillingDocumentItem
    from .billing_entry_unit import BillingEntryUnit

CENT = Decimal("0.01")
LINE_DESCRIPTION_MAX_LENGTH = 120
MONTHS_PER_YEAR = 12
MINIMUM_INSTALLMENTS = 2


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

    condominium = models.ForeignKey(
        Condominium, on_delete=models.PROTECT, related_name="billing_entries"
    )
    event = models.ForeignKey(
        BillingEvent,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="entries",
    )
    description = models.CharField(max_length=120, blank=True)
    allocation = models.CharField(max_length=12, choices=Allocation.choices)
    # Fraction entries only: the condominium's criterion the total is split by.
    apportionment_criterion = models.ForeignKey(
        CondominiumApportionmentCriterion,
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="billing_entries",
    )
    recurrence = models.CharField(max_length=12, choices=Recurrence.choices)
    installments_total = models.PositiveSmallIntegerField(null=True, blank=True)
    start_month = models.DateField(validators=[validate_first_day_of_month])
    end_month = models.DateField(
        null=True, blank=True, validators=[validate_first_day_of_month]
    )
    # Empty only for an event that credits the administradora (`BillingEntryRules`).
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="billing_entries",
    )
    # Chosen from the cost center when the entry is saved: its only active template (`clean`).
    entry_template = models.ForeignKey(
        EntryTemplate,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="billing_entries",
    )
    # Individual: what each unit pays. Collective and fraction: the total split among the selected units.
    # Negative is a discount (spec 055): never zero, never for an event that credits the administradora.
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[validate_non_zero_amount]
    )

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Billing Entry"
        verbose_name_plural = "Billing Entries"
        ordering = ("-start_month", "created_at")
        constraints = (
            models.CheckConstraint(
                name="billing_entry_amount_non_zero",
                condition=~Q(amount=0),
                violation_error_message=FinanceValidatorError.AMOUNT_ZERO.message,
                violation_error_code=FinanceValidatorError.AMOUNT_ZERO.value,
            ),
            models.CheckConstraint(
                name="billing_entry_criterion_matches_allocation",
                condition=Q(allocation="fraction", apportionment_criterion__isnull=False)
                | (~Q(allocation="fraction") & Q(apportionment_criterion__isnull=True)),
                violation_error_message=BillingEntryError.APPORTIONMENT_CRITERION_DOES_NOT_MATCH_ALLOCATION.message,
                violation_error_code=BillingEntryError.APPORTIONMENT_CRITERION_DOES_NOT_MATCH_ALLOCATION.value,
            ),
            models.CheckConstraint(
                name="billing_entry_installments_match_recurrence",
                condition=Q(recurrence="installments", installments_total__gte=MINIMUM_INSTALLMENTS)
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
        template = (
            self.cost_center.sole_active_entry_template()
            if self.cost_center is not None
            else None
        )
        if template is not None:
            self.entry_template = template

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        self.assert_not_used()
        return super().delete(*args, **kwargs)

    @property
    def credits_company(self) -> bool:
        """Whether the money is the administradora's (its event says so) instead of a condominium's."""
        return self.event is not None and self.event.credits_company

    def assert_not_used(self) -> None:
        """A used entry cannot be deleted, nor can its selection of units change: it would rewrite what was issued."""
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
        """What the boleto line says: `0005-EVENT NAME`, then the description, and the installment when there is one."""
        parts = [self.event.line_label if self.event is not None else "", self.description]
        text = " - ".join(part for part in parts if part)
        label = self.installment_label(reference_month)
        text = f"{text} ({label})" if label and text else text or label
        return text[:LINE_DESCRIPTION_MAX_LENGTH]

    def amounts_by_unit(
        self,
        units: Sequence[Unit],
        overrides: dict[uuid.UUID, Decimal] | None = None,
    ) -> dict[uuid.UUID, Decimal]:
        """What each of the selected `units` pays for this entry.

        Individual: the entry's amount (or the unit's own override). Collective: the total split equally. Fraction: the
        total split in proportion to the unit's fraction in the entry's criterion. A split is rounded half-up to the
        cent and the leftover cents go to one unit (the first by name, or the largest fraction) so the parts add up
        to the total.
        """
        if self.allocation == self.Allocation.INDIVIDUAL:
            given = overrides or {}
            return {unit.pk: given.get(unit.pk, self.amount) for unit in units}
        if self.allocation == self.Allocation.COLLECTIVE:
            weights = {unit.pk: Decimal(1) for unit in units}
        else:
            weights = self.fractions_of(units)
        return self._split(units, weights)

    def amounts_for_selected_units(self) -> dict[uuid.UUID, Decimal]:
        """What each selected unit that is active pays (the units come with their own override, if any)."""
        links = [link for link in self.entry_units.all() if link.unit.active]
        return self.amounts_by_unit(
            [link.unit for link in links],
            {link.unit_id: link.amount for link in links if link.amount is not None},
        )

    def fractions_of(self, units: Sequence[Unit]) -> dict[uuid.UUID, Decimal]:
        """The units' fractions in the entry's criterion (0 for a unit that has none)."""
        assert self.apportionment_criterion_id is not None
        values_by_unit_id = dict(
            UnitApportionmentFraction.objects.filter(
                criterion_id=self.apportionment_criterion_id,
                unit_id__in=[unit.pk for unit in units],
            ).values_list("unit_id", "value")
        )
        return {unit.pk: values_by_unit_id.get(unit.pk, Decimal(0)) for unit in units}

    def collect_unit_errors(
        self, units_values: list[dict[str, Any]]
    ) -> list[ValidationError | None]:
        """Each selected unit validated as it would be saved with this entry, saved or only a candidate; None when valid.

        The unit rules that need the entry (its condominium, its allocation) cannot run in the unit alone.
        """
        from .billing_entry_unit import BillingEntryUnit  # circular at import time

        errors: list[ValidationError | None] = []
        for unit_values in units_values:
            link = BillingEntryUnit(**unit_values)
            link.entry = self
            try:
                link.full_clean(exclude=["entry"])
            except ValidationError as error:
                errors.append(error)
            else:
                errors.append(None)
        return errors

    def _split(
        self, units: Sequence[Unit], weights: dict[uuid.UUID, Decimal]
    ) -> dict[uuid.UUID, Decimal]:
        total_weight = sum(weights.values(), Decimal(0))
        if not units or total_weight <= 0:
            return {unit.pk: Decimal(0) for unit in units}
        shares = {
            unit_id: (self.amount * weight / total_weight).quantize(
                CENT, rounding=ROUND_HALF_UP
            )
            for unit_id, weight in weights.items()
        }
        leftover = self.amount - sum(shares.values(), Decimal(0))
        if leftover:
            first = min(
                units, key=lambda unit: (-weights[unit.pk], unit.name, str(unit.pk))
            )
            shares[first.pk] += leftover
        return shares

    @override
    def __str__(self) -> str:
        return self.line_description(self.start_month) or str(self.pk)
