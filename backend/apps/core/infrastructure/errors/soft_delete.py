from .base import RuleError


class SoftDeleteError(RuleError):
    RESTORE_PARENT_ARCHIVED = (
        "soft_delete.restore.parent_archived",
        "This record belongs to a deleted record; restore that one first.",
    )
