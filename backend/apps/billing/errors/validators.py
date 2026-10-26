from apps.core.infrastructure.errors.base import RuleError


class BillingValidatorError(RuleError):
    MONTH_NOT_FIRST_DAY = ("month.not_first_day", "A month is written as its first day.")
