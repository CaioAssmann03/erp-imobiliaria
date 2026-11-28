from typing import Any, final, override

from django.db import models, transaction
from django.db.models import Q

from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import EntryBatchError
from apps.finance.models.rules import EntryBatchRules
from apps.finance.validators import validate_positive_batch_number, validate_positive_cash_number


@final
class EntryBatch(BaseModel):
    """A group of ledger entries (the PDF's *Lote*); one batch may cover several condominiums."""

    class OriginType(models.TextChoices):
        CASH = ("cash", "Cash")
        EXTRA_CASH = ("extra_cash", "Extra cash")
        BANK = ("bank", "Bank")

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="entry_batches"
    )
    # The number the staff knows the batch by (spec 073): typed for a manual batch, the next free one when it is left
    # out (the batches of an automatic posting). It never changes, and neither does the date.
    number = models.PositiveIntegerField(blank=True, validators=[validate_positive_batch_number])
    batch_date = models.DateField()
    origin = models.CharField(max_length=10, choices=OriginType.choices)
    cash_number = models.PositiveIntegerField(
        null=True, blank=True, validators=[validate_positive_cash_number]
    )

    company_lookup = "company"

    class Meta:
        verbose_name = "Entry Batch"
        verbose_name_plural = "Entry Batches"
        constraints = (
            models.UniqueConstraint(
                fields=("company", "number"),
                name="entry_batch_unique_number_per_company",
                violation_error_message=EntryBatchError.NUMBER_DUPLICATE_IN_COMPANY.message,
                violation_error_code=EntryBatchError.NUMBER_DUPLICATE_IN_COMPANY.value,
            ),
            models.CheckConstraint(
                name="entry_batch_cash_number_matches_origin",
                condition=(
                    Q(origin="bank", cash_number__isnull=True)
                    | (~Q(origin="bank") & Q(cash_number__isnull=False))
                ),
                violation_error_message=EntryBatchError.CASH_NUMBER_REQUIRED.message,
                violation_error_code=EntryBatchError.CASH_NUMBER_REQUIRED.value,
            ),
        )

    @classmethod
    def next_number_in(cls, company_id: Any) -> int:
        """The first number after the highest one of the company (1 when it has no batch)."""
        highest = cls.objects.filter(company_id=company_id).aggregate(highest=models.Max("number"))["highest"]
        return 1 if highest is None else highest + 1

    def is_bank_origin(self) -> bool:
        return self.origin == self.OriginType.BANK

    @override
    def clean(self) -> None:
        EntryBatchRules(self).validate()

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        with transaction.atomic():
            if self.number is None:
                # The company row is the lock that serializes two creations taking the same next number.
                _ = Company.objects.select_for_update().filter(pk=self.company_id).first()
                self.number = self.next_number_in(self.company_id)
            super().save(*args, **kwargs)

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.entries.exists():
            raise EntryBatchError.DELETION_HAS_ENTRIES.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.batch_date} - {self.origin}"
