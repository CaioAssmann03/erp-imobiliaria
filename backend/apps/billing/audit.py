from apps.core.audit import register_audited

from .models import BillingDocument, BillingDocumentItem, BillingDocumentPdf, BillingPlan, BillingPlanItem, BillingRun


def register() -> None:
    register_audited(BillingPlan)
    register_audited(BillingPlanItem)
    register_audited(BillingDocument)
    register_audited(BillingDocumentItem)
    register_audited(BillingDocumentPdf)
    register_audited(BillingRun)
