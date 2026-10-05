from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.core.error_codes import CoreErrorCode


def validate_percentage(percentage: Decimal | float | int) -> None:
    if not 0 <= percentage <= 100:
        raise ValidationError(
            "Percentage must be between 0 and 100.", code=CoreErrorCode.PERCENTAGE_OUT_OF_RANGE.value
        )
