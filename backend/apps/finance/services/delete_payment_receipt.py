from django.db import transaction

from apps.core.infrastructure.storage import object_storage
from apps.finance.models import PaymentReceipt


def delete_payment_receipt(receipt: PaymentReceipt) -> None:
    """Delete the row and, once that commits, the file; a failed file delete leaves an orphan, never a dangling row."""
    storage = object_storage.get_object_storage()
    file_key = receipt.file_key
    with transaction.atomic():
        receipt.delete()
        transaction.on_commit(lambda: storage.discard_object(file_key, "Receipt file"))
