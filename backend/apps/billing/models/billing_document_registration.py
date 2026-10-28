from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.billing.errors import BillingDocumentRegistrationError
from apps.billing.models.billing_document import BillingDocument
from apps.billing.models.gateway_account import GatewayAccount
from apps.core.models.base import BaseModel


@final
class BillingDocumentRegistration(BaseModel):
    """One attempt to register a document as a charge at the gateway (spec 031). Attempts are never deleted.

    A document has at most one `active` registration; a replaced one is `replaced`, a refused one `failed`, one the gateway
    cancelled `cancelled`.
    """

    class Status(models.TextChoices):
        ACTIVE = ("active", "Active")
        REPLACED = ("replaced", "Replaced")
        # The gateway cancelled or deleted the charge (an expired registration): it cannot be paid until a reissue.
        CANCELLED = ("cancelled", "Cancelled")
        FAILED = ("failed", "Failed")

    class Reason(models.TextChoices):
        INITIAL_ISSUE = ("initial_issue", "Initial issue")
        REISSUE = ("reissue", "Reissue")

    document = models.ForeignKey(
        BillingDocument, on_delete=models.PROTECT, related_name="registrations"
    )
    gateway_account = models.ForeignKey(
        GatewayAccount, on_delete=models.PROTECT, related_name="registrations"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE
    )
    reason = models.CharField(
        max_length=15, choices=Reason.choices, default=Reason.INITIAL_ISSUE
    )
    registered_due_date = models.DateField()
    gateway_payment_id = models.CharField(max_length=64, blank=True)
    our_number = models.CharField(max_length=40, blank=True)
    digitable_line = models.CharField(max_length=60, blank=True)
    barcode = models.CharField(max_length=60, blank=True)
    boleto_url = models.URLField(max_length=500, blank=True)
    pix_payload = models.TextField(blank=True)
    pix_expires_at = models.DateTimeField(null=True, blank=True)
    # The gateway's own error codes of a refused attempt (never the request body).
    error_codes = models.JSONField(default=list, blank=True)

    company_lookup = "document__unit__condominium__company"

    class Meta:
        verbose_name = "Billing Document Registration"
        verbose_name_plural = "Billing Document Registrations"
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("document",),
                condition=Q(status="active"),
                name="billing_document_registration_one_active_per_document",
                violation_error_message=BillingDocumentRegistrationError.SECOND_ACTIVE_FOR_DOCUMENT.message,
                violation_error_code=BillingDocumentRegistrationError.SECOND_ACTIVE_FOR_DOCUMENT.value,
            ),
            models.UniqueConstraint(
                fields=("gateway_payment_id",),
                condition=~Q(gateway_payment_id=""),
                name="billing_document_registration_unique_payment_id",
                violation_error_message=BillingDocumentRegistrationError.PAYMENT_ID_DUPLICATE.message,
                violation_error_code=BillingDocumentRegistrationError.PAYMENT_ID_DUPLICATE.value,
            ),
        )

    @override
    def clean(self) -> None:
        is_new_reissue = self._state.adding and self.reason == self.Reason.REISSUE
        if is_new_reissue and self.registered_due_date < timezone.localdate():
            raise ValidationError(
                {
                    "registered_due_date": BillingDocumentRegistrationError.REISSUE_DUE_DATE_IN_PAST.to_validation_error()
                }
            )

    @override
    def __str__(self) -> str:
        return f"{self.document} ({self.status})"
