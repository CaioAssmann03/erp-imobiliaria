from datetime import date
from decimal import Decimal

from apps.billing.errors import CondominiumBillingRulesError
from apps.billing.errors.validators import BillingValidatorError

# The Civil Code (art. 1.336 §1) lets a condominium charge a fine of up to 2 % on a late contribution.
MAX_LATE_FEE_PERCENTAGE = Decimal(2)


def validate_first_day_of_month(month: date) -> None:
    if month.day != 1:
        raise BillingValidatorError.MONTH_NOT_FIRST_DAY.to_validation_error()


def validate_due_day(due_day: int) -> None:
    if not 1 <= due_day <= 28:
        raise CondominiumBillingRulesError.DUE_DAY_OUT_OF_RANGE.to_validation_error()


def validate_issuance_day(issuance_day: int) -> None:
    if not 1 <= issuance_day <= 28:
        raise CondominiumBillingRulesError.ISSUANCE_DAY_OUT_OF_RANGE.to_validation_error()


def validate_late_fee_percentage(late_fee_percentage: Decimal) -> None:
    if not 0 <= late_fee_percentage <= MAX_LATE_FEE_PERCENTAGE:
        raise CondominiumBillingRulesError.LATE_FEE_OUT_OF_RANGE.to_validation_error()


def validate_initial_late_fee_days(days: int) -> None:
    if days < 1:
        raise CondominiumBillingRulesError.INITIAL_LATE_FEE_DAYS_OUT_OF_RANGE.to_validation_error()


def validate_ideal_fraction_number(ideal_fraction_number: int) -> None:
    """Kept only because migration 0001 references it: the field it validated is gone (spec 039)."""
