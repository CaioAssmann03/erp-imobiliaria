from apps.core.infrastructure.errors.base import RuleError


class BankAccountError(RuleError):
    ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER = (
        "bank_account.account_number.duplicate_for_holder",
        "This holder already has an account with this bank, branch and number.",
    )
    CONDOMINIUM_OTHER_COMPANY = (
        "bank_account.condominium.other_company",
        "The condominium belongs to another company.",
    )
