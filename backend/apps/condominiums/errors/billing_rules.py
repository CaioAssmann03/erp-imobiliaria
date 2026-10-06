from apps.core.errors.base import RuleError


class BillingRulesError(RuleError):
    DUE_DAY_OUT_OF_RANGE = (
        "billing_rules.due_day.out_of_range",
        "Due day must be between 1 and 28.",
    )
    DISCOUNT_OUT_OF_RANGE = (
        "billing_rules.early_payment_discount_percentage.out_of_range",
        "Discount must be between 0 and 100.",
    )
