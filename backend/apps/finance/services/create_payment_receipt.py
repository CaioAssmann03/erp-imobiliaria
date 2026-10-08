import uuid
from dataclasses import dataclass

from apps.accounts.models import User
from apps.core.storage import object_storage
from apps.finance.models import AccountPayable, PaymentReceipt
from apps.finance.models.payment_receipt import UPLOAD_URL_TTL_SECONDS


@dataclass(frozen=True)
class ReceiptFile:
    original_name: str
    content_type: str
    size_bytes: int


@dataclass(frozen=True)
class PaymentReceiptUpload:
    receipt: PaymentReceipt
    upload_url: str
    expires_in: int


def create_payment_receipt(account: AccountPayable, file: ReceiptFile, uploaded_by: User) -> PaymentReceiptUpload:
    """Register an unconfirmed receipt and issue the signed URL the browser uploads the file to."""
    storage = object_storage.get_object_storage()
    receipt = PaymentReceipt(
        account_payable=account,
        file_key=f"payment-receipts/{account.company_id}/{account.pk}/{uuid.uuid4()}",
        original_name=file.original_name.strip(),
        content_type=file.content_type,
        size_bytes=file.size_bytes,
        uploaded_by=uploaded_by,
    )
    receipt.full_clean()
    receipt.save()
    upload_url = storage.presigned_upload_url(receipt.file_key, receipt.content_type, UPLOAD_URL_TTL_SECONDS)
    return PaymentReceiptUpload(receipt=receipt, upload_url=upload_url, expires_in=UPLOAD_URL_TTL_SECONDS)
