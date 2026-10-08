from django.db import transaction
from django.utils import timezone

from apps.core.storage import object_storage
from apps.finance.errors import PaymentReceiptError
from apps.finance.models import PaymentReceipt
from apps.finance.validators import MAX_RECEIPT_SIZE_BYTES


def confirm_payment_receipt(receipt: PaymentReceipt) -> PaymentReceipt:
    """Check the uploaded file in the bucket; a missing or wrong-sized file is deleted and refused.

    The refusal is raised after the transaction ends, so the deletion of the row is kept.
    """
    storage = object_storage.get_object_storage()
    refusal: PaymentReceiptError | None = None
    with transaction.atomic():
        locked = PaymentReceipt.objects.select_for_update().get(pk=receipt.pk)
        if locked.confirmed_at is not None:
            raise PaymentReceiptError.ALREADY_CONFIRMED.to_validation_error()
        actual_size = storage.object_size(locked.file_key)
        if actual_size is None:
            refusal = PaymentReceiptError.FILE_MISSING_IN_STORAGE
        elif actual_size != locked.size_bytes or actual_size > MAX_RECEIPT_SIZE_BYTES:
            refusal = PaymentReceiptError.FILE_SIZE_MISMATCH
        if refusal is None:
            locked.confirmed_at = timezone.now()
            locked.save(update_fields=("confirmed_at", "updated_at"))
            return locked
        locked.delete()
    if actual_size is not None:
        storage.delete_object(locked.file_key)
    raise refusal.to_validation_error()
