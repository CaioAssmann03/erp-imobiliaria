from apps.core.infrastructure.errors.base import RuleError


class PersonError(RuleError):
    ARCHIVE_HAS_CURRENT_LINKS = (
        "person.archive.has_current_links",
        "This person is a current owner or tenant of a unit; end the link first.",
    )
    ARCHIVE_IS_ACTIVE_SUPPLIER = (
        "person.archive.is_active_supplier",
        "This person is an active supplier; delete the supplier first.",
    )
    ARCHIVE_IS_ADVISOR = (
        "person.archive.is_advisor",
        "This person is the advisor of a condominium; change the advisor first.",
    )
    ANONYMIZE_NOT_ARCHIVED = (
        "person.anonymize.not_archived",
        "Only a deleted person can be anonymized.",
    )
    ANONYMIZE_RETENTION_PERIOD = (
        "person.anonymize.retention_period",
        "This person's data must still be kept for legal reasons.",
    )
    ANONYMIZE_ALREADY_DONE = (
        "person.anonymize.already_done",
        "This person is already anonymized.",
    )
