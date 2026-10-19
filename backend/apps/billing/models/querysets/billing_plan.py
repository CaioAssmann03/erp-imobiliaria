from datetime import date
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Q

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_plan import BillingPlan  # noqa: F401


class BillingPlanQuerySet(models.QuerySet["BillingPlan"]):
    def in_force(self, reference_month: date) -> "BillingPlanQuerySet":
        """The active plans whose start and end months (when set) include the reference month."""
        month = reference_month.replace(day=1)
        return self.filter(
            Q(start_month__isnull=True) | Q(start_month__lte=month),
            Q(end_month__isnull=True) | Q(end_month__gte=month),
            active=True,
        )
