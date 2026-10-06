from apps.core.errors.base import RuleError


class CondominiumsValidatorError(RuleError):
    DUE_DAY_OUT_OF_RANGE = ("due_day.out_of_range", "Due day must be between 1 and 28.")
    IDEAL_FRACTION_OUT_OF_RANGE = (
        "ideal_fraction.out_of_range",
        "Ideal fraction must be greater than 0 and at most 1.",
    )
    VALUE_NEGATIVE = ("value.negative", "Value cannot be negative.")
