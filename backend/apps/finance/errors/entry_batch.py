from apps.core.errors.base import RuleError


class EntryBatchError(RuleError):
    CASH_NUMBER_REQUIRED = (
        "entry_batch.cash_number.required",
        "The cash number is required for a cash or extra cash batch.",
    )
    CASH_NUMBER_NOT_ALLOWED = (
        "entry_batch.cash_number.not_allowed",
        "A bank batch has no cash number.",
    )
    DELETION_HAS_ENTRIES = (
        "entry_batch.deletion.has_entries",
        "A batch with ledger entries cannot be deleted.",
    )
