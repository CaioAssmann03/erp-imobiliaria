from typing import Any, final, override

from django.db import models
from django.db.models import Q

from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import EntryBatchError
from apps.finance.models.rules import EntryBatchRules
from apps.finance.validators import validate_positive_cash_number


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

    def is_bank_origin(self) -> bool:
        return self.origin == self.OriginType.BANK

    @override
    def clean(self) -> None:
        EntryBatchRules(self).validate()

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.entries.exists():
            raise EntryBatchError.DELETION_HAS_ENTRIES.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.batch_date} - {self.origin}"
