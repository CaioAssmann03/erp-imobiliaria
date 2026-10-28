from typing import Any, final, override

from django.db import models

from apps.billing.errors import BillingEventError
from apps.core.models import Company
from apps.core.models.base import BaseModel


@final
class BillingEvent(BaseModel):
    """A short code the staff knows by heart (250 = "Limpeza do condomínio") that fills a launch's description.

    It is not tied to a cost center: it only names what the launch is about (spec 039).
    """

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="billing_events"
    )
    code = models.PositiveIntegerField()
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)
    # The event of money that belongs to the administradora (0005 TARIFA BANCO): a launch with it has no sub-conta and
    # its money is credited to the administradora's own ledger, never to a condominium (spec 038).
    credits_company = models.BooleanField(default=False)

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

    @property
    def line_label(self) -> str:
        """How the event opens a boleto line: its code in four digits, a dash and its name (`0052-CONDOMINIO`)."""
        return f"{self.code:04d}-{self.name}"

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.entries.exists():
            raise BillingEventError.DELETION_HAS_ENTRIES.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.code} - {self.name}"
