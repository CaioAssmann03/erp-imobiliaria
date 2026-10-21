from apps.core.errors.base import RuleError


class BillingDocumentPdfError(RuleError):
    NOT_GENERATED = (
        "billing_document_pdf.not_generated",
        "This billing document has no PDF yet.",
    )
