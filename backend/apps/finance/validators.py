import re
from decimal import Decimal

from apps.finance.errors.validators import FinanceValidatorError


def validate_bank_code(bank_code: str) -> None:
    """The Brazilian bank code (COMPE): exactly three digits (`033` Santander, `001` Banco do Brasil)."""
    if not re.fullmatch(r"[0-9]{3}", bank_code):
        raise FinanceValidatorError.BANK_CODE_INVALID_FORMAT.to_validation_error()


def validate_positive_amount(amount: Decimal) -> None:
    if amount <= 0:
        raise FinanceValidatorError.AMOUNT_NOT_POSITIVE.to_validation_error()


def validate_positive_cash_number(cash_number: int) -> None:
    if cash_number <= 0:
        raise FinanceValidatorError.CASH_NUMBER_NOT_POSITIVE.to_validation_error()
