from apps.core.audit import register_audited

from .models import BillingPlan, BillingPlanItem


def register() -> None:
    register_audited(BillingPlan)
    register_audited(BillingPlanItem)
