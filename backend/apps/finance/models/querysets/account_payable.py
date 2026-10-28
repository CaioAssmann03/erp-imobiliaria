from datetime import date, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models

from apps.core.infrastructure.dates import add_months
from apps.core.infrastructure.search.ranking import relevance_rank
from apps.core.infrastructure.search.text_match import name_matches

if TYPE_CHECKING:
    from apps.core.infrastructure.search.term import ClassifiedTerm

    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.account_payable import AccountPayable  # noqa: F401


NEXT_DAYS_WINDOW = 7  # days after the reference date counted by `due_next_7_days`


class AccountPayableQuerySet(models.QuerySet["AccountPayable"]):
    def open(self) -> "AccountPayableQuerySet":
        return self.filter(status=self.model.Status.OPEN)

    def overdue(self, reference_date: date) -> "AccountPayableQuerySet":
        return self.open().filter(due_date__lt=reference_date)

    def due_between(self, first_day: date, last_day: date) -> "AccountPayableQuerySet":
        """Open accounts due from `first_day` to `last_day`, both included."""
        return self.open().filter(due_date__gte=first_day, due_date__lte=last_day)

    def due_today(self, reference_date: date) -> "AccountPayableQuerySet":
        return self.due_between(reference_date, reference_date)

    def due_next_7_days(self, reference_date: date) -> "AccountPayableQuerySet":
        """Open accounts due from the day after `reference_date` up to 7 days after it."""
        return self.due_between(
            reference_date + timedelta(days=1), reference_date + timedelta(days=NEXT_DAYS_WINDOW)
        )

    def due_this_month(self, reference_date: date) -> "AccountPayableQuerySet":
        """Open accounts due in the month of `reference_date`, from its first to its last day."""
        first_day = reference_date.replace(day=1)
        return self.due_between(first_day, add_months(first_day, 1) - timedelta(days=1))

    def open_by_due_date(self) -> "AccountPayableQuerySet":
        """Open accounts ordered by due date, the earliest first (ties by creation time)."""
        return self.open().order_by("due_date", "created_at")

    def with_supplier_and_condominium(self) -> "AccountPayableQuerySet":
        """Loads the supplier's person and the condominium in the same query."""
        return self.select_related("supplier__person", "condominium")

    def totals(self) -> dict[str, object]:
        """How many accounts there are and the sum of their amounts (zero when there are none)."""
        aggregate = self.aggregate(count=models.Count("pk"), total=models.Sum("amount"))
        return {"count": aggregate["count"], "total": aggregate["total"] or Decimal(0)}

    def search(self, query: "ClassifiedTerm") -> "AccountPayableQuerySet":
        """Accounts whose description, document number or supplier name match the global search term.

        The best match comes first, and the latest due date first among equals. A term that only
        asks for an ID (a single digit) finds none: accounts have no ID.
        """
        conditions = name_matches(query, "description", "document_number", "supplier__person__name")
        if conditions is None:
            return self.none()
        contains, starts_with = conditions
        return (
            self.filter(contains)
            .annotate(rank=relevance_rank([starts_with], None))
            .order_by("rank", "-due_date")
            .with_supplier_and_condominium()
        )
