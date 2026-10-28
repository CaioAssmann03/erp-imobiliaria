from datetime import date
from typing import TYPE_CHECKING

from django.db import models

from apps.core.infrastructure.search.ranking import relevance_rank
from apps.core.infrastructure.search.text_match import name_matches

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_document import BillingDocument  # noqa: F401
    from apps.core.infrastructure.search.term import ClassifiedTerm


class BillingDocumentQuerySet(models.QuerySet["BillingDocument"]):
    def awaiting_payment(self) -> "BillingDocumentQuerySet":
        return self.filter(status__in=self.model.AWAITING_PAYMENT_STATUSES)

    def overdue_on(self, reference_date: date) -> "BillingDocumentQuerySet":
        """Documents still awaiting payment whose due date is before the reference date."""
        return self.awaiting_payment().filter(due_date__lt=reference_date)

    def search(self, query: "ClassifiedTerm") -> "BillingDocumentQuerySet":
        """Documents whose payer name or unit number match the global search term.

        The best match comes first, and the latest reference month first among equals. A document has no
        ID, so a term that only asks for an ID (a single digit) finds none.
        """
        conditions = name_matches(query, "payer__name", "unit__name")
        if conditions is None:
            return self.none()
        contains, starts_with = conditions
        return (
            self.filter(contains)
            .annotate(rank=relevance_rank([starts_with], None))
            .select_related("unit__condominium", "payer")
            .order_by("rank", "-reference_month")
        )
