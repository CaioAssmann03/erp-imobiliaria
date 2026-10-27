from decimal import Decimal

from apps.condominiums.errors import UnitError


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise UnitError.IDEAL_FRACTION_OUT_OF_RANGE.to_validation_error()


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise UnitError.UTILITY_VALUES_NEGATIVE.to_validation_error()


# Kept only because migrations 0002, 0005 and 0007 reference them: the billing rules they validated
# moved to `apps.billing.validators` (spec 041).
def validate_due_day(due_day: int) -> None:
    pass


def validate_issuance_day(issuance_day: int) -> None:
    pass


def validate_late_fee_percentage(late_fee_percentage: Decimal) -> None:
    pass


def validate_initial_late_fee_days(days: int) -> None:
    pass
