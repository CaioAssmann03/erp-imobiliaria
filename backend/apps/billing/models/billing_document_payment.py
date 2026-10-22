from typing import final, override

from django.db import models

from apps.billing.models.billing_document import BillingDocument
from apps.billing.models.billing_document_registration import BillingDocumentRegistration
from apps.billing.models.gateway_event import GatewayEvent
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.validators import validate_positive_amount


@final
class BillingDocumentPayment(BaseModel):
    """The payment of a billing document as the gateway reported it (spec 032); one per document."""

    document = models.OneToOneField(BillingDocument, on_delete=models.PROTECT, related_name="payment")
    registration = models.ForeignKey(BillingDocumentRegistration, on_delete=models.PROTECT, related_name="payments")
    gateway_event = models.ForeignKey(GatewayEvent, on_delete=models.PROTECT, related_name="payments")
    paid_on = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[validate_positive_amount])
    # What reaches the condominium after the gateway fee; informational.
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    company_lookup = "document__unit__condominium__company"

    class Meta:
        verbose_name = "Billing Document Payment"
        verbose_name_plural = "Billing Document Payments"
        ordering = ("-paid_on",)
        constraints = (
            models.CheckConstraint(
                name="billing_document_payment_amount_positive",
                condition=models.Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.document} paid {self.amount} on {self.paid_on}"
