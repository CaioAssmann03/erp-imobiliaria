from apps.core.infrastructure.errors.base import RuleError


class LateInterestRateError(RuleError):
    START_DATE_DUPLICATE_IN_CONDOMINIUM = (
        "late_interest_rate.start_date.duplicate_in_condominium",
        "This condominium already has an interest rate starting on this date.",
    )
