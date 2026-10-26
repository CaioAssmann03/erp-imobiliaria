from apps.core.infrastructure.errors.base import RuleError


class FinanceValidatorError(RuleError):
    AMOUNT_NOT_POSITIVE = ("amount.not_positive", "The amount must be greater than zero.")
    CASH_NUMBER_NOT_POSITIVE = ("cash_number.not_positive", "The cash number must be greater than zero.")
    BANK_CODE_INVALID_FORMAT = ("bank_code.invalid_format", "The bank code must have exactly 3 digits.")
