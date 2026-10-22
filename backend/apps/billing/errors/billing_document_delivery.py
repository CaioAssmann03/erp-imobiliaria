from apps.core.errors.base import RuleError


class BillingDocumentDeliveryError(RuleError):
    DESTINATION_BLANK = (
        "billing_document_delivery.destination.blank",
        "A delivery names its destination unless it failed for lack of one.",
    )
    DUPLICATE_FOR_REGISTRATION = (
        "billing_document_delivery.registration.duplicate_channel",
        "A registration is delivered once per channel.",
    )
    PROVIDER_ID_REQUIRED = (
        "billing_document_delivery.provider_message_id.required",
        "A sent or delivered e-mail has the provider's message id.",
    )
