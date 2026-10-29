import re
from decimal import Decimal

from apps.finance.errors.payment_receipt import PaymentReceiptError
from apps.finance.errors.validators import FinanceValidatorError

ALLOWED_RECEIPT_CONTENT_TYPES = ("application/pdf", "image/jpeg", "image/png")
MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024


def validate_bank_code(bank_code: str) -> None:
    """The Brazilian bank code (COMPE): exactly three digits (`033` Santander, `001` Banco do Brasil)."""
    if not re.fullmatch(r"[0-9]{3}", bank_code):
        raise FinanceValidatorError.BANK_CODE_INVALID_FORMAT.to_validation_error()


def validate_positive_amount(amount: Decimal) -> None:
    if amount <= 0:
        raise FinanceValidatorError.AMOUNT_NOT_POSITIVE.to_validation_error()


def validate_non_zero_amount(amount: Decimal) -> None:
    """A value that may be negative (a discount, spec 055) but never zero."""
    if amount == 0:
        raise FinanceValidatorError.AMOUNT_ZERO.to_validation_error()


def validate_positive_cash_number(cash_number: int) -> None:
    if cash_number <= 0:
        raise FinanceValidatorError.CASH_NUMBER_NOT_POSITIVE.to_validation_error()


def validate_receipt_content_type(content_type: str) -> None:
    if content_type not in ALLOWED_RECEIPT_CONTENT_TYPES:
        raise PaymentReceiptError.CONTENT_TYPE_NOT_ALLOWED.to_validation_error()


def validate_receipt_size(size_bytes: int) -> None:
    if size_bytes <= 0:
        raise PaymentReceiptError.SIZE_BYTES_NOT_POSITIVE.to_validation_error()
    if size_bytes > MAX_RECEIPT_SIZE_BYTES:
        raise PaymentReceiptError.SIZE_BYTES_TOO_LARGE.to_validation_error()
