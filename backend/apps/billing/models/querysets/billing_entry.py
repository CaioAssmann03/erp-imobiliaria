from datetime import date
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import ExpressionWrapper, F, Q, Value
from django.db.models.functions import ExtractMonth, ExtractYear

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_entry import BillingEntry  # noqa: F401

MONTHS_PER_YEAR = 12


class BillingEntryQuerySet(models.QuerySet["BillingEntry"]):
    def in_force(self, reference_month: date) -> "BillingEntryQuerySet":
        """The entries a month's boleto carries: a single month, the months of its installments, or every month from
        its start until it is ended. `BillingEntry.covers` is the same rule for one record."""
        month = reference_month.replace(day=1)
        months_since_start = ExpressionWrapper(
            (Value(month.year) - ExtractYear("start_month")) * MONTHS_PER_YEAR
            + (Value(month.month) - ExtractMonth("start_month")),
            output_field=models.IntegerField(),
        )
        return self.annotate(months_since_start=months_since_start).filter(
            Q(recurrence="once", months_since_start=0)
            | Q(recurrence="installments", months_since_start__gte=0, months_since_start__lt=F("installments_total"))
            | Q(recurrence="always", months_since_start__gte=0)
            & (Q(end_month__isnull=True) | Q(end_month__gte=month))
        )
