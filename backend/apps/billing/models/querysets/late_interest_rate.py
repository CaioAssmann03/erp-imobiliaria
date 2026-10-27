from datetime import date
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from apps.billing.models.late_interest_rate import LateInterestRate


class LateInterestRateQuerySet(models.QuerySet["LateInterestRate"]):
    def in_force_on(self, reference_date: date) -> "LateInterestRate | None":
        """The rate with the latest start date not after `reference_date`; `None` before the first one."""
        return self.filter(start_date__lte=reference_date).order_by("-start_date").first()
