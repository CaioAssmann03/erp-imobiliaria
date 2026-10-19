from datetime import date

from apps.billing.errors.validators import BillingValidatorError

FIRST_IDEAL_FRACTION_NUMBER = 1
LAST_IDEAL_FRACTION_NUMBER = 6


def validate_first_day_of_month(month: date) -> None:
    if month.day != 1:
        raise BillingValidatorError.MONTH_NOT_FIRST_DAY.to_validation_error()


def validate_ideal_fraction_number(ideal_fraction_number: int) -> None:
    """The unit's fraction an item shares by: 1 is `ideal_fraction`, 2–6 are `ideal_fraction_2` … `_6`."""
    if not FIRST_IDEAL_FRACTION_NUMBER <= ideal_fraction_number <= LAST_IDEAL_FRACTION_NUMBER:
        raise BillingValidatorError.IDEAL_FRACTION_NUMBER_OUT_OF_RANGE.to_validation_error()
