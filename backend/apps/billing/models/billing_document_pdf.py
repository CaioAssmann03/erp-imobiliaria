from typing import final, override

from django.db import models
from django.utils import timezone

from apps.billing.models.billing_document import BillingDocument
from apps.core.models.base import BaseModel

DOWNLOAD_URL_TTL_SECONDS = 300


@final
class BillingDocumentPdf(BaseModel):
    """The current draft PDF of a billing document; the file lives in the bucket (spec 027).

    Generating again replaces it, so a document has at most one.
    """

    document = models.OneToOneField(
        BillingDocument, on_delete=models.CASCADE, related_name="pdf"
    )
    # Built by the service from the company and document ids and a random id, never from user input.
    file_key = models.CharField(max_length=255, unique=True, editable=False)
    size_bytes = models.PositiveBigIntegerField()
    generated_at = models.DateTimeField(default=timezone.now)

    company_lookup = "document__unit__condominium__company"

    class Meta:
        verbose_name = "Billing Document PDF"
        verbose_name_plural = "Billing Document PDFs"
        ordering = ("-generated_at",)

    @override
    def __str__(self) -> str:
        return f"PDF of {self.document}"
