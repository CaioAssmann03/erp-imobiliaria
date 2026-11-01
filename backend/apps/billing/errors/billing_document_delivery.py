from apps.core.infrastructure.errors.base import RuleError


class BillingDocumentDeliveryError(RuleError):
    DESTINATION_BLANK = (
        "billing_document_delivery.destination.blank",
        "A sent or delivered e-mail names its destination.",
    )
    DUPLICATE_FOR_REGISTRATION = (
        "billing_document_delivery.registration.duplicate_channel",
        "A registration is delivered once per channel.",
    )
    PROVIDER_ID_REQUIRED = (
        "billing_document_delivery.provider_message_id.required",
        "A sent or delivered e-mail has the provider's message id.",
    )
