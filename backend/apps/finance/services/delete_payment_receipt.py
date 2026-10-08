import logging

from django.db import transaction

from apps.core.storage import object_storage
from apps.finance.models import PaymentReceipt

logger = logging.getLogger(__name__)


def delete_payment_receipt(receipt: PaymentReceipt) -> None:
    """Delete the row and, once that commits, the file; a failed file delete leaves an orphan, never a dangling row."""
    storage = object_storage.get_object_storage()
    file_key = receipt.file_key
    with transaction.atomic():
        receipt.delete()
        transaction.on_commit(lambda: _delete_object(storage, file_key))


def _delete_object(storage: object_storage.ObjectStorage, file_key: str) -> None:
    try:
        storage.delete_object(file_key)
    except Exception:
        logger.exception("Receipt file %s could not be deleted from the bucket; it is now an orphan.", file_key)
