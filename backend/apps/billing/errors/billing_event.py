from apps.core.errors.base import RuleError


class BillingEventError(RuleError):
    CODE_DUPLICATE_IN_COMPANY = (
        "billing_event.code.duplicate_in_company",
        "This company already has an event with this code.",
    )
    DELETION_HAS_ENTRIES = (
        "billing_event.deletion.has_entries",
        "This event is used by billing entries; deactivate it instead.",
    )
