from apps.core.infrastructure.errors.base import RuleError


class CondominiumError(RuleError):
    ADVISOR_OTHER_COMPANY = (
        "condominium.advisor.other_company",
        "Advisor belongs to another company.",
    )
    CNPJ_ARCHIVED = (
        "condominium.cnpj.archived",
        "An archived condominium has this CNPJ; restore it instead of registering it again.",
    )
    ARCHIVE_STILL_ACTIVE = (
        "condominium.archive.still_active",
        "An active condominium cannot be deleted; deactivate it first.",
    )
    ARCHIVE_HAS_UNITS = (
        "condominium.archive.has_units",
        "This condominium still has units; delete them first.",
    )
    ARCHIVE_HAS_BLOCKS = (
        "condominium.archive.has_blocks",
        "This condominium still has blocks; delete them first.",
    )
    ARCHIVE_HAS_COST_CENTERS = (
        "condominium.archive.has_cost_centers",
        "This condominium still has cost centers; delete them first.",
    )
    ARCHIVE_HAS_OPEN_ACCOUNTS_PAYABLE = (
        "condominium.archive.has_open_accounts_payable",
        "This condominium has open accounts payable; pay or cancel them first.",
    )
