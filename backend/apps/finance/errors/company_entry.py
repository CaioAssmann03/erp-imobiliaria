from apps.core.infrastructure.errors.base import RuleError


class CompanyEntryError(RuleError):
    UPDATE_NOT_ALLOWED = (
        "company_entry.update_not_allowed",
        "An entry of the administradora cannot be changed.",
    )
    DELETION_NOT_ALLOWED = (
        "company_entry.deletion_not_allowed",
        "An entry of the administradora cannot be deleted.",
    )
