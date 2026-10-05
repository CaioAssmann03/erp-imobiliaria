from decimal import Decimal

from django.core.exceptions import ValidationError


def validate_due_day(due_day: int) -> None:
    if not 1 <= due_day <= 28:
        raise ValidationError("Due day must be between 1 and 28.")


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise ValidationError("Ideal fraction must be greater than 0 and at most 1.")


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise ValidationError("Value cannot be negative.")
