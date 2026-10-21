from apps.core.errors.base import RuleError


class BillingRunError(RuleError):
    FINISHED_BEFORE_STARTED = (
        "billing_run.finished_at.before_started_at",
        "A billing run cannot finish before it starts.",
    )
