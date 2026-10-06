from datetime import date
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.account_payable import AccountPayable  # noqa: F401


class AccountPayableQuerySet(models.QuerySet["AccountPayable"]):
    def open(self) -> "AccountPayableQuerySet":
        return self.filter(status=self.model.Status.OPEN)

    def overdue(self, reference_date: date) -> "AccountPayableQuerySet":
        return self.open().filter(due_date__lt=reference_date)

    def due_between(self, first_day: date, last_day: date) -> "AccountPayableQuerySet":
        """Open accounts due from `first_day` to `last_day`, both included."""
        return self.open().filter(due_date__gte=first_day, due_date__lte=last_day)
