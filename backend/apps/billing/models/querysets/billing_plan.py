from datetime import date
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Q

from apps.core.infrastructure.search.ranking import relevance_rank
from apps.core.infrastructure.search.text_match import name_matches

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_plan import BillingPlan  # noqa: F401
    from apps.core.infrastructure.search.term import ClassifiedTerm


class BillingPlanQuerySet(models.QuerySet["BillingPlan"]):
    def in_force(self, reference_month: date) -> "BillingPlanQuerySet":
        """The active plans whose start and end months (when set) include the reference month."""
        month = reference_month.replace(day=1)
        return self.filter(
            Q(start_month__isnull=True) | Q(start_month__lte=month),
            Q(end_month__isnull=True) | Q(end_month__gte=month),
            active=True,
        )

    def search(self, query: "ClassifiedTerm") -> "BillingPlanQuerySet":
        """Plans whose name matches the global search term, the best match first.

        A plan has no ID, so a term that only asks for an ID (a single digit) finds none.
        """
        conditions = name_matches(query, "name")
        if conditions is None:
            return self.none()
        contains, starts_with = conditions
        return (
            self.filter(contains)
            .annotate(rank=relevance_rank([starts_with], None))
            .order_by("rank", "name")
            .select_related("condominium")
        )
