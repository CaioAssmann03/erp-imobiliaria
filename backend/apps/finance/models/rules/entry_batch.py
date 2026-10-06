from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import EntryBatchError

if TYPE_CHECKING:
    from apps.finance.models.entry_batch import EntryBatch  # noqa: F401


class EntryBatchRules(ModelRules["EntryBatch"]):
    @rule("cash_number", EntryBatchError.CASH_NUMBER_REQUIRED)
    def cash_batch_lacks_cash_number(self) -> bool:
        batch = self.instance
        return not batch.is_bank_origin() and batch.cash_number is None

    @rule("cash_number", EntryBatchError.CASH_NUMBER_NOT_ALLOWED)
    def bank_batch_has_cash_number(self) -> bool:
        batch = self.instance
        return batch.is_bank_origin() and batch.cash_number is not None
