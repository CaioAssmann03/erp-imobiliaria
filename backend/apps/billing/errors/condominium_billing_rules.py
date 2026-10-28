from apps.core.infrastructure.errors.base import RuleError


class CondominiumBillingRulesError(RuleError):
    DUE_DAY_OUT_OF_RANGE = (
        "condominium_billing_rules.due_day.out_of_range",
        "Due day must be between 1 and 28.",
    )
    DISCOUNT_OUT_OF_RANGE = (
        "condominium_billing_rules.early_payment_discount_percentage.out_of_range",
        "Discount must be between 0 and 100.",
    )
    LATE_FEE_OUT_OF_RANGE = (
        "condominium_billing_rules.late_fee_percentage.out_of_range",
        "Late fee must be between 0 and 2%.",
    )
    INITIAL_LATE_FEE_INCOMPLETE = (
        "condominium_billing_rules.initial_late_fee.incomplete",
        "The first-days late fee needs both a percentage and a number of days.",
    )
    ISSUANCE_DAY_OUT_OF_RANGE = (
        "condominium_billing_rules.issuance_day.out_of_range",
        "Issuance day must be between 1 and 28.",
    )
    INITIAL_LATE_FEE_DAYS_OUT_OF_RANGE = (
        "condominium_billing_rules.initial_late_fee_days.out_of_range",
        "The first-days late fee must last at least 1 day.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "condominium_billing_rules.condominium.immutable",
        "The condominium of its billing rules cannot be changed.",
    )
