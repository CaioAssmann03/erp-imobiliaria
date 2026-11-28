import datetime
from functools import cached_property
from typing import TYPE_CHECKING, TypedDict

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import EntryBatchError

if TYPE_CHECKING:
    from apps.finance.models.entry_batch import EntryBatch  # noqa: F401


class StoredBatchKey(TypedDict):
    number: int
    batch_date: datetime.date


class EntryBatchRules(ModelRules["EntryBatch"]):
    @cached_property
    def stored(self) -> StoredBatchKey | None:
        """The number and the date the batch has in the database; None while it is being created."""
        batch = self.instance
        if batch._state.adding:
            return None
        row = type(batch).objects.filter(pk=batch.pk).values("number", "batch_date").first()
        return None if row is None else StoredBatchKey(number=row["number"], batch_date=row["batch_date"])

    @rule("cash_number", EntryBatchError.CASH_NUMBER_REQUIRED)
    def cash_batch_lacks_cash_number(self) -> bool:
        batch = self.instance
        return not batch.is_bank_origin() and batch.cash_number is None

    @rule("cash_number", EntryBatchError.CASH_NUMBER_NOT_ALLOWED)
    def bank_batch_has_cash_number(self) -> bool:
        batch = self.instance
        return batch.is_bank_origin() and batch.cash_number is not None

    @rule("number", EntryBatchError.NUMBER_IMMUTABLE)
    def number_differs_from_the_stored_one(self) -> bool:
        return self.stored is not None and self.stored["number"] != self.instance.number

    @rule("batch_date", EntryBatchError.BATCH_DATE_IMMUTABLE)
    def date_differs_from_the_stored_one(self) -> bool:
        return self.stored is not None and self.stored["batch_date"] != self.instance.batch_date
