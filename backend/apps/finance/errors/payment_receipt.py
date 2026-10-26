from apps.core.infrastructure.errors.base import RuleError


class PaymentReceiptError(RuleError):
    ACCOUNT_PAYABLE_NOT_PAID = (
        "payment_receipt.account_payable.not_paid",
        "Only a paid account can have a receipt.",
    )
    CONTENT_TYPE_NOT_ALLOWED = (
        "payment_receipt.content_type.not_allowed",
        "The receipt must be a PDF, JPEG or PNG file.",
    )
    SIZE_BYTES_NOT_POSITIVE = (
        "payment_receipt.size_bytes.not_positive",
        "The file cannot be empty.",
    )
    SIZE_BYTES_TOO_LARGE = (
        "payment_receipt.size_bytes.too_large",
        "The file is larger than the 10 MB limit.",
    )
    FILE_MISSING_IN_STORAGE = (
        "payment_receipt.file.missing_in_storage",
        "The file was not uploaded.",
    )
    FILE_SIZE_MISMATCH = (
        "payment_receipt.file.size_mismatch",
        "The uploaded file does not have the declared size.",
    )
    ALREADY_CONFIRMED = (
        "payment_receipt.already_confirmed",
        "The receipt is already confirmed.",
    )
