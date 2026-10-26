from decimal import Decimal

from apps.core.infrastructure.errors.validators import CoreValidatorError


def validate_percentage(percentage: Decimal | float | int) -> None:
    if not 0 <= percentage <= 100:
        raise CoreValidatorError.PERCENTAGE_OUT_OF_RANGE.to_validation_error()
