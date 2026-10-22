from apps.core.errors.base import RuleError


class BillingDocumentRegistrationError(RuleError):
    DOCUMENT_NOT_ISSUED = (
        "billing_document_registration.document.not_issued",
        "Only an issued document can be registered at the gateway.",
    )
    NO_ACTIVE_GATEWAY_ACCOUNT = (
        "billing_document_registration.gateway_account.not_active",
        "The condominium has no active gateway account.",
    )
    PAYER_WITHOUT_DOCUMENT = (
        "billing_document_registration.payer.without_document",
        "The payer has no CPF or CNPJ, which the gateway requires.",
    )
    SECOND_ACTIVE_FOR_DOCUMENT = (
        "billing_document_registration.status.second_active",
        "A document has a single active registration.",
    )
    PAYMENT_ID_DUPLICATE = (
        "billing_document_registration.gateway_payment_id.duplicate",
        "A gateway charge belongs to a single registration.",
    )
