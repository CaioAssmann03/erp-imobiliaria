from typing import Any, final, override

from django.db import models, transaction

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
    # The number the staff knows it by; the lowest free one (from 1) when it is left out.
    code = models.PositiveIntegerField(blank=True)
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

    @classmethod
    def next_code_in(cls, company_id: Any) -> int:
        """The lowest code of the company that no event has, from 1: with 1 and 250 taken it is 2, then 3, and so on.

        Two indexed queries (company, code), the second stopping at the first gap, so it does not scan the catalog.
        """
        events = cls.objects.filter(company_id=company_id, code__gte=1)
        if not events.filter(code=1).exists():
            return 1
        successor_is_taken = events.filter(code=models.OuterRef("code") + 1)
        last_of_the_first_run = (
            events.filter(~models.Exists(successor_is_taken)).order_by("code").values_list("code", flat=True).first()
        )
        # The highest code always has a free successor, so there is a first one.
        assert last_of_the_first_run is not None
        return int(last_of_the_first_run) + 1

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        with transaction.atomic():
            if self.code is None:
                # The company row is the lock that serializes two creations taking the same next code.
                _ = Company.objects.select_for_update().filter(pk=self.company_id).first()
                self.code = self.next_code_in(self.company_id)
            super().save(*args, **kwargs)

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
