from decimal import Decimal

from apps.condominiums.errors.validators import CondominiumsValidatorError


def validate_due_day(due_day: int) -> None:
    if not 1 <= due_day <= 28:
        raise CondominiumsValidatorError.DUE_DAY_OUT_OF_RANGE.to_validation_error()


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise CondominiumsValidatorError.IDEAL_FRACTION_OUT_OF_RANGE.to_validation_error()


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise CondominiumsValidatorError.VALUE_NEGATIVE.to_validation_error()
