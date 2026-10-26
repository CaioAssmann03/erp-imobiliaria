from apps.core.infrastructure.errors.base import RuleError


class BillingValidatorError(RuleError):
    MONTH_NOT_FIRST_DAY = ("month.not_first_day", "A month is written as its first day.")
    IDEAL_FRACTION_NUMBER_OUT_OF_RANGE = (
        "ideal_fraction_number.out_of_range",
        "The ideal fraction number must be between 1 and 6.",
    )
