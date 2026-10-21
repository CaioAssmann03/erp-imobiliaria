from decimal import Decimal

from apps.condominiums.errors import BillingRulesError, UnitError

# The Civil Code (art. 1.336 §1) lets a condominium charge a fine of up to 2 % on a late contribution.
MAX_LATE_FEE_PERCENTAGE = Decimal(2)


def validate_due_day(due_day: int) -> None:
    if not 1 <= due_day <= 28:
        raise BillingRulesError.DUE_DAY_OUT_OF_RANGE.to_validation_error()


def validate_issuance_day(issuance_day: int) -> None:
    if not 1 <= issuance_day <= 28:
        raise BillingRulesError.ISSUANCE_DAY_OUT_OF_RANGE.to_validation_error()


def validate_late_fee_percentage(late_fee_percentage: Decimal) -> None:
    if not 0 <= late_fee_percentage <= MAX_LATE_FEE_PERCENTAGE:
        raise BillingRulesError.LATE_FEE_OUT_OF_RANGE.to_validation_error()


def validate_initial_late_fee_days(days: int) -> None:
    if days < 1:
        raise BillingRulesError.INITIAL_LATE_FEE_DAYS_OUT_OF_RANGE.to_validation_error()


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise UnitError.IDEAL_FRACTION_OUT_OF_RANGE.to_validation_error()


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise UnitError.UTILITY_VALUES_NEGATIVE.to_validation_error()
