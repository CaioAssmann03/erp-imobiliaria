from apps.core.errors.base import RuleError


class CurrentAccountError(RuleError):
    CONDOMINIUM_DUPLICATE = (
        "current_account.condominium.duplicate",
        "This condominium already has a current account.",
    )
    CONDOMINIUM_OTHER_COMPANY = (
        "current_account.condominium.other_company",
        "The condominium belongs to another company.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "current_account.condominium.immutable",
        "The condominium of a current account cannot be changed.",
    )
    DELETION_HAS_ENTRIES = (
        "current_account.deletion.has_entries",
        "A current account with ledger entries cannot be deleted.",
    )
