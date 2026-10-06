from apps.core.errors.base import RuleError


class CurrentAccountEntryError(RuleError):
    AMOUNT_NOT_POSITIVE = (
        "current_account_entry.amount.not_positive",
        "The amount must be greater than zero.",
    )
    CURRENT_ACCOUNT_OTHER_COMPANY = (
        "current_account_entry.current_account.other_company",
        "The current account belongs to another company.",
    )
    BATCH_OTHER_COMPANY = (
        "current_account_entry.batch.other_company",
        "The batch belongs to another company.",
    )
    COST_CENTER_OTHER_CONDOMINIUM = (
        "current_account_entry.cost_center.other_condominium",
        "The cost center belongs to another condominium than the current account.",
    )
    COST_CENTER_INACTIVE = (
        "current_account_entry.cost_center.inactive",
        "The cost center is inactive.",
    )
    ENTRY_TEMPLATE_OTHER_CONDOMINIUM = (
        "current_account_entry.entry_template.other_condominium",
        "The entry template belongs to another condominium than the current account.",
    )
    ENTRY_TEMPLATE_INACTIVE = (
        "current_account_entry.entry_template.inactive",
        "The entry template is inactive.",
    )
    COMPETENCE_MONTH_NOT_FIRST_DAY = (
        "current_account_entry.competence_month.not_first_day",
        "The competence month must be the first day of the month.",
    )
    JUSTIFICATION_BLANK = (
        "current_account_entry.justification.blank",
        "The justification is required.",
    )
    UPDATE_NOT_ALLOWED = (
        "current_account_entry.update_not_allowed",
        "A ledger entry never changes; reverse it with an opposite entry.",
    )
    DELETION_NOT_ALLOWED = (
        "current_account_entry.deletion_not_allowed",
        "A ledger entry is never deleted; reverse it with an opposite entry.",
    )
    ACCOUNT_PAYABLE_MATCHES_ORIGIN = (
        "current_account_entry.account_payable.mismatch_origin",
        "Only an entry posted by an account payable payment points at that account payable.",
    )
    ACCOUNT_PAYABLE_ALREADY_POSTED = (
        "current_account_entry.account_payable.already_posted",
        "This account payable already has its ledger entry.",
    )
    ACCOUNT_PAYABLE_OTHER_CONDOMINIUM = (
        "current_account_entry.account_payable.other_condominium",
        "The account payable belongs to another condominium than the current account.",
    )
    REVERSAL_OTHER_ACCOUNT = (
        "current_account_entry.reversal_of.other_account",
        "A reversal belongs to the same current account as the entry it reverses.",
    )
    REVERSAL_OF_A_REVERSAL = (
        "current_account_entry.reversal_of.is_a_reversal",
        "A reversal cannot be reversed.",
    )
    REVERSAL_ALREADY_REVERSED = (
        "current_account_entry.reversal_of.already_reversed",
        "This entry has already been reversed.",
    )
    REVERSAL_SAME_KIND = (
        "current_account_entry.reversal_of.same_kind",
        "A reversal has the opposite kind of the entry it reverses.",
    )
    REVERSAL_AMOUNT_DIFFERS = (
        "current_account_entry.reversal_of.amount_differs",
        "A reversal has the same amount as the entry it reverses.",
    )
    UNIT_OTHER_CONDOMINIUM = (
        "current_account_entry.unit.other_condominium",
        "The unit belongs to another condominium than the current account.",
    )
