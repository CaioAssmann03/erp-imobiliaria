from apps.core.errors.base import RuleError


class GatewayReconciliationRunError(RuleError):
    FINISHED_BEFORE_STARTED = (
        "gateway_reconciliation_run.finished_at.before_started_at",
        "A reconciliation run cannot finish before it starts.",
    )
    WINDOW_INVERTED = (
        "gateway_reconciliation_run.window_end.before_window_start",
        "The reconciliation window cannot end before it starts.",
    )
