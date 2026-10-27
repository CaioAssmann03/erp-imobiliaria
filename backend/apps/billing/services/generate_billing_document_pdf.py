import logging
import uuid

from django.db import transaction
from django.utils import timezone

from apps.billing.models import BillingDocument, BillingDocumentPdf
from apps.billing.services.render_billing_document_pdf import (
    render_billing_document_pdf,
)
from apps.core.infrastructure.storage import object_storage

logger = logging.getLogger(__name__)

PDF_CONTENT_TYPE = "application/pdf"


def generate_billing_document_pdf(document: BillingDocument) -> BillingDocumentPdf:
    """Render the document's draft PDF, store it in the bucket and make it the document's current one.

    A PDF that already exists is replaced and its old file deleted once that commits; a failed delete
    leaves an orphan object, never a dangling row.
    """
    storage = object_storage.get_object_storage()
    content = render_billing_document_pdf(document)
    company_id = document.unit.condominium.company_id
    file_key = f"billing-documents/{company_id}/{document.pk}/{uuid.uuid4()}.pdf"
    storage.put_object(file_key, content, PDF_CONTENT_TYPE)
    with transaction.atomic():
        pdf = BillingDocumentPdf.objects.select_for_update().filter(document=document).first()
        replaced_key = pdf.file_key if pdf else None
        pdf = pdf or BillingDocumentPdf(document=document)
        pdf.file_key = file_key
        pdf.size_bytes = len(content)
        pdf.generated_at = timezone.now()
        pdf.full_clean()
        pdf.save()
        if replaced_key:
            transaction.on_commit(lambda: _delete_object(storage, replaced_key))
    return pdf


def _delete_object(storage: object_storage.ObjectStorage, file_key: str) -> None:
    try:
        storage.delete_object(file_key)
    except Exception:
        logger.exception("Replaced PDF %s could not be deleted from the bucket; it is now an orphan.", file_key)
