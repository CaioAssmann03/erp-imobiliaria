from decimal import Decimal

from django.core.exceptions import ValidationError

from .error_codes import CondominiumsErrorCode


def validate_due_day(due_day: int) -> None:
    if not 1 <= due_day <= 28:
        raise ValidationError(
            "Due day must be between 1 and 28.", code=CondominiumsErrorCode.DUE_DAY_OUT_OF_RANGE.value
        )


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise ValidationError(
            "Ideal fraction must be greater than 0 and at most 1.",
            code=CondominiumsErrorCode.IDEAL_FRACTION_OUT_OF_RANGE.value,
        )


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise ValidationError("Value cannot be negative.", code=CondominiumsErrorCode.VALUE_NEGATIVE.value)
