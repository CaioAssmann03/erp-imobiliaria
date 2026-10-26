from datetime import date

from apps.billing.errors.validators import BillingValidatorError


def validate_first_day_of_month(month: date) -> None:
    if month.day != 1:
        raise BillingValidatorError.MONTH_NOT_FIRST_DAY.to_validation_error()



def validate_ideal_fraction_number(ideal_fraction_number: int) -> None:
    """Kept only because migration 0001 references it: the field it validated is gone (spec 039)."""
