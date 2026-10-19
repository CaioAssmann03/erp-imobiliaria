from typing import final, override

from django.conf import settings
from django.db import models

from apps.core.models.base import BaseModel
from apps.finance.models.rules import PaymentReceiptRules
from apps.finance.validators import validate_receipt_content_type, validate_receipt_size

from .account_payable import AccountPayable

UPLOAD_URL_TTL_SECONDS = 600
DOWNLOAD_URL_TTL_SECONDS = 300


@final
class PaymentReceipt(BaseModel):
    """The proof of payment (PDF or photo) of a paid account payable; the file lives in the bucket (spec 018).

    It exists unconfirmed (`confirmed_at` empty) from the moment its upload URL is issued until the
    file is checked in the bucket; only confirmed receipts are listed.
    """

    account_payable = models.ForeignKey(AccountPayable, on_delete=models.PROTECT, related_name="receipts")
    # Built by the service from the company and account ids and a random id, never from the file name.
    file_key = models.CharField(max_length=255, unique=True, editable=False)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=30, validators=[validate_receipt_content_type])
    size_bytes = models.PositiveBigIntegerField(validators=[validate_receipt_size])
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payment_receipts")
    confirmed_at = models.DateTimeField(null=True, blank=True, editable=False)

    company_lookup = "account_payable__company"

    class Meta:
        verbose_name = "Payment Receipt"
        verbose_name_plural = "Payment Receipts"
        ordering = ("-created_at",)

    @override
    def clean(self) -> None:
        PaymentReceiptRules(self).validate()

    @override
    def __str__(self) -> str:
        return self.original_name
