from datetime import date

from apps.core.infrastructure.errors.validators import CoreValidatorError


def validate_first_day_of_month(month: date) -> None:
    if month.day != 1:
        raise CoreValidatorError.MONTH_NOT_FIRST_DAY.to_validation_error()
