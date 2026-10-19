from apps.core.errors.base import RuleError


class BillingPlanError(RuleError):
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "billing_plan.name.duplicate_in_condominium",
        "This condominium already has a billing plan with this name.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "billing_plan.condominium.immutable",
        "The condominium of a billing plan cannot be changed.",
    )
    END_MONTH_BEFORE_START_MONTH = (
        "billing_plan.end_month.before_start_month",
        "The end month cannot be before the start month.",
    )
