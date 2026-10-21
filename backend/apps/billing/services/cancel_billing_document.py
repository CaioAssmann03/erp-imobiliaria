from django.db import transaction

from apps.billing.models import BillingDocument


@transaction.atomic
def cancel_billing_document(document: BillingDocument) -> BillingDocument:
    """Cancel an issued or registered document; the model refuses any other transition."""
    _ = BillingDocument.objects.select_for_update().get(pk=document.pk)
    document.refresh_from_db()
    document.status = BillingDocument.Status.CANCELLED
    document.full_clean()
    document.save()
    return document
