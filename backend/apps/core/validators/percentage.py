from decimal import Decimal

from django.core.exceptions import ValidationError


def validate_percentage(percentage: Decimal | float | int) -> None:
    """Percentage between 0 and 100 (inclusive)."""
    if not 0 <= percentage <= 100:
        raise ValidationError("Percentage must be between 0 and 100.")
