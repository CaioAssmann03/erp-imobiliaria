from apps.core.errors.base import RuleError


class BillingDocumentError(RuleError):
    REFERENCE_MONTH_DUPLICATE_FOR_UNIT = (
        "billing_document.reference_month.duplicate_for_unit",
        "This unit already has a billing document for this reference month.",
    )
    PAYER_OTHER_COMPANY = (
        "billing_document.payer.other_company",
        "The payer belongs to another company.",
    )
    DATA_IMMUTABLE = (
        "billing_document.data.immutable",
        "The unit, payer, months, due date, amount and terms of a billing document cannot be changed.",
    )
    STATUS_TRANSITION_NOT_ALLOWED = (
        "billing_document.status.transition_not_allowed",
        "A billing document goes from issued to registered or cancelled, and from registered to paid or cancelled.",
    )
    ITEMS_REQUIRED = (
        "billing_document.items.required",
        "A billing document needs at least one item.",
    )
    AMOUNT_DIFFERS_FROM_ITEMS_TOTAL = (
        "billing_document.amount.differs_from_items_total",
        "The amount of the billing document must equal the sum of its items.",
    )
