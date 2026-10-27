import datetime
from typing import Any, final, override

from django.db import models
from django.db.models import Q

from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import CompanyEntryError, FinanceValidatorError
from apps.finance.validators import validate_positive_amount


@final
class CompanyEntry(BaseModel):
    """A credit of the administradora itself in the system (spec 038): the registration fee of a boleto.

    The administradora's money never goes through a condominium's current account. One entry per document item,
    written when the boleto is paid and never changed afterwards.
    """

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="company_entries"
    )
    billing_document_item = models.OneToOneField(
        "billing.BillingDocumentItem",
        on_delete=models.PROTECT,
        related_name="company_entry",
    )
    entry_date = models.DateField()
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[validate_positive_amount]
    )
    description = models.CharField(max_length=255)

    company_lookup = "company"

    class Meta:
        verbose_name = "Company Entry"
        verbose_name_plural = "Company Entries"
        ordering = ("-entry_date", "-created_at")
        constraints = (
            models.CheckConstraint(
                name="company_entry_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
        )

    @classmethod
    def receiving(cls, item: Any, paid_on: datetime.date) -> "CompanyEntry":
        """The credit that the payment of a document item of the administradora posts (not saved).

        `item` is a `billing.BillingDocumentItem` that credits the company (it has no cost center).
        """
        document = item.document
        return cls(
            company_id=document.unit.condominium.company_id,
            billing_document_item=item,
            entry_date=paid_on,
            amount=item.amount,
            description=f"{document.unit.condominium.name} - {document.unit} - {item.description}"[:255],
        )

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding:
            raise CompanyEntryError.UPDATE_NOT_ALLOWED.to_validation_error()
        super().save(*args, **kwargs)

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise CompanyEntryError.DELETION_NOT_ALLOWED.to_validation_error()

    @override
    def __str__(self) -> str:
        return f"{self.entry_date} {self.amount} {self.description}"
