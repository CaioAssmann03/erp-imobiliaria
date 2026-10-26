from typing import final, override

from django.db import models

from apps.billing.errors import BillingEventError
from apps.core.models import Company
from apps.core.models.base import BaseModel


@final
class BillingEvent(BaseModel):
    """A short code the staff knows by heart (250 = "Limpeza do condomínio") that fills a launch's description.

    It is not tied to a cost center: it only names what the launch is about (spec 039).
    """

    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="billing_events")
    code = models.PositiveIntegerField()
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    company_lookup = "company"

    class Meta:
        verbose_name = "Billing Event"
        verbose_name_plural = "Billing Events"
        ordering = ("code",)
        constraints = (
            models.UniqueConstraint(
                fields=("company", "code"),
                name="billing_event_unique_code_per_company",
                violation_error_message=BillingEventError.CODE_DUPLICATE_IN_COMPANY.message,
                violation_error_code=BillingEventError.CODE_DUPLICATE_IN_COMPANY.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.code} - {self.name}"
