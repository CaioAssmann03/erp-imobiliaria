from apps.core.errors.base import RuleError


class FinanceValidatorError(RuleError):
    AMOUNT_NOT_POSITIVE = ("amount.not_positive", "The amount must be greater than zero.")
    BANK_CODE_INVALID_FORMAT = ("bank_code.invalid_format", "The bank code must have exactly 3 digits.")
