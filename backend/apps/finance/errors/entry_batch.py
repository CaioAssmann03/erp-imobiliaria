from apps.core.infrastructure.errors.base import RuleError


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
    NUMBER_NOT_POSITIVE = (
        "entry_batch.number.not_positive",
        "The batch number must be greater than zero.",
    )
    NUMBER_DUPLICATE_IN_COMPANY = (
        "entry_batch.number.duplicate_in_company",
        "A batch with this number already exists.",
    )
    NUMBER_IMMUTABLE = (
        "entry_batch.number.immutable",
        "The number of a batch never changes.",
    )
    BATCH_DATE_IMMUTABLE = (
        "entry_batch.batch_date.immutable",
        "The date of a batch never changes.",
    )
