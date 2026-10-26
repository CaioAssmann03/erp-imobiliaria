from apps.core.infrastructure.audit import register_audited

from .models import (
    BillingDocument,
    BillingDocumentDelivery,
    BillingDocumentItem,
    BillingDocumentPayment,
    BillingDocumentPdf,
    BillingDocumentRegistration,
    BillingPlan,
    BillingPlanItem,
    BillingRun,
    GatewayAccount,
    GatewayCustomer,
    GatewayReconciliationRun,
)


def register() -> None:
    register_audited(BillingPlan)
    register_audited(BillingPlanItem)
    register_audited(BillingDocument)
    register_audited(BillingDocumentItem)
    register_audited(BillingDocumentPdf)
    register_audited(BillingRun)
    register_audited(GatewayAccount, excluded_fields=("api_key", "webhook_token"))
    register_audited(GatewayCustomer)
    register_audited(BillingDocumentRegistration)
    register_audited(BillingDocumentPayment)
    register_audited(GatewayReconciliationRun)
    register_audited(BillingDocumentDelivery)
