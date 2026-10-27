from typing import final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingDocumentItemError
from apps.billing.models.billing_document import BillingDocument
from apps.billing.models.rules import BillingDocumentItemRules
from apps.core.models.base import BaseModel
from apps.finance.errors import FinanceValidatorError
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.validators import validate_positive_amount


@final
class BillingDocumentItem(BaseModel):
    """One line of a billing document (the PDF's *DocumentoCobrancaItem*): a value booked in a cost center.

    The entry template is the kind of ledger entry the payment will post (phase 5).
    """

    document = models.ForeignKey(BillingDocument, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveSmallIntegerField(default=0)
    description = models.CharField(max_length=120)
    # Both empty on a line that credits the administradora (the registration fee), both set on every other line.
    cost_center = models.ForeignKey(
        CostCenter, on_delete=models.PROTECT, null=True, blank=True, related_name="billing_document_items"
    )
    entry_template = models.ForeignKey(
        EntryTemplate, on_delete=models.PROTECT, null=True, blank=True, related_name="billing_document_items"
    )
    credits_company = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[validate_positive_amount])
    # The launch (spec 039) the line comes from; empty for a plan item. It freezes the launch once a document exists.
    billing_entry = models.ForeignKey(
        "billing.BillingEntry", on_delete=models.PROTECT, null=True, blank=True, related_name="document_items"
    )

    company_lookup = "document__unit__condominium__company"

    class Meta:
        verbose_name = "Billing Document Item"
        verbose_name_plural = "Billing Document Items"
        ordering = ("document", "position")
        constraints = (
            models.UniqueConstraint(
                fields=("document", "position"),
                name="billing_document_item_unique_position_per_document",
                violation_error_message=BillingDocumentItemError.POSITION_DUPLICATE_IN_DOCUMENT.message,
                violation_error_code=BillingDocumentItemError.POSITION_DUPLICATE_IN_DOCUMENT.value,
            ),
            models.CheckConstraint(
                name="billing_document_item_credits_company_matches_cost_center",
                condition=Q(credits_company=True, cost_center__isnull=True, entry_template__isnull=True)
                | Q(credits_company=False, cost_center__isnull=False, entry_template__isnull=False),
                violation_error_message=BillingDocumentItemError.CREDITS_COMPANY_MISMATCH.message,
                violation_error_code=BillingDocumentItemError.CREDITS_COMPANY_MISMATCH.value,
            ),
            models.CheckConstraint(
                name="billing_document_item_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
        )

    @override
    def clean(self) -> None:
        BillingDocumentItemRules(self).validate()

    @override
    def __str__(self) -> str:
        return self.description
