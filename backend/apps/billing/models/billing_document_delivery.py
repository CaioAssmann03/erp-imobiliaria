from typing import final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingDocumentDeliveryError
from apps.billing.models.billing_document import BillingDocument
from apps.billing.models.billing_document_registration import (
    BillingDocumentRegistration,
)
from apps.core.models.base import BaseModel


@final
class BillingDocumentDelivery(BaseModel):
    """The sending of a registered boleto to its payer (the PDF's *EnvioDocumentoCobranca*, spec 035).

    One per registration and channel, so a retry cannot send the e-mail twice. A payer without an e-mail is a `failed`
    delivery with a reason, never silently skipped.
    """

    class Channel(models.TextChoices):
        EMAIL = ("email", "E-mail")
        WHATSAPP = ("whatsapp", "WhatsApp")
        MAIL = ("mail", "Mail")
        PORTAL = ("portal", "Portal")

    class Status(models.TextChoices):
        PENDING = ("pending", "Pending")
        SENT = ("sent", "Sent")
        DELIVERED = ("delivered", "Delivered")
        FAILED = ("failed", "Failed")

    document = models.ForeignKey(
        BillingDocument, on_delete=models.PROTECT, related_name="deliveries"
    )
    registration = models.ForeignKey(
        BillingDocumentRegistration, on_delete=models.PROTECT, related_name="deliveries"
    )
    channel = models.CharField(
        max_length=10, choices=Channel.choices, default=Channel.EMAIL
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    destination = models.CharField(max_length=254, blank=True)
    provider_message_id = models.CharField(max_length=120, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    # A stable code: `payer_without_email`, `email_not_configured`, `provider_rejected`, `bounced`, `complained`.
    failure_reason = models.CharField(max_length=60, blank=True)

    company_lookup = "document__unit__condominium__company"

    class Meta:
        verbose_name = "Billing Document Delivery"
        verbose_name_plural = "Billing Document Deliveries"
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("registration", "channel"),
                name="billing_document_delivery_unique_channel_per_registration",
                violation_error_message=BillingDocumentDeliveryError.DUPLICATE_FOR_REGISTRATION.message,
                violation_error_code=BillingDocumentDeliveryError.DUPLICATE_FOR_REGISTRATION.value,
            ),
            models.CheckConstraint(
                name="billing_document_delivery_sent_has_provider_id",
                condition=~Q(status__in=("sent", "delivered"))
                | ~Q(provider_message_id=""),
                violation_error_message=BillingDocumentDeliveryError.PROVIDER_ID_REQUIRED.message,
                violation_error_code=BillingDocumentDeliveryError.PROVIDER_ID_REQUIRED.value,
            ),
        )
        indexes = (
            models.Index(
                fields=("provider_message_id",), name="billing_delivery_msg_idx"
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.document} -> {self.destination or '-'} ({self.status})"
