import re
from decimal import Decimal

from django.core.exceptions import ValidationError

from .error_codes import FinanceErrorCode


def validate_bank_code(bank_code: str) -> None:
    """The Brazilian bank code (COMPE): exactly three digits (`033` Santander, `001` Banco do Brasil)."""
    if not re.fullmatch(r"[0-9]{3}", bank_code):
        raise ValidationError(
            "The bank code must have exactly 3 digits.",
            code=FinanceErrorCode.BANK_CODE_INVALID_FORMAT.value,
        )


def validate_positive_amount(amount: Decimal) -> None:
    """Money amounts of a payable are greater than zero."""
    if amount <= 0:
        raise ValidationError(
            "The amount must be greater than zero.", code=FinanceErrorCode.AMOUNT_NOT_POSITIVE.value
        )
