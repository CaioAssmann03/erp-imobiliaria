from datetime import date
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_document import BillingDocument  # noqa: F401


class BillingDocumentQuerySet(models.QuerySet["BillingDocument"]):
    def awaiting_payment(self) -> "BillingDocumentQuerySet":
        return self.filter(status__in=self.model.AWAITING_PAYMENT_STATUSES)

    def overdue_on(self, reference_date: date) -> "BillingDocumentQuerySet":
        """Documents still awaiting payment whose due date is before the reference date."""
        return self.awaiting_payment().filter(due_date__lt=reference_date)
