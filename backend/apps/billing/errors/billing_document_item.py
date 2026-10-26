from apps.core.infrastructure.errors.base import RuleError


class BillingDocumentItemError(RuleError):
    POSITION_DUPLICATE_IN_DOCUMENT = (
        "billing_document_item.position.duplicate_in_document",
        "This billing document already has an item at this position.",
    )
    COST_CENTER_OTHER_CONDOMINIUM = (
        "billing_document_item.cost_center.other_condominium",
        "The cost center belongs to another condominium.",
    )
    COST_CENTER_INACTIVE = (
        "billing_document_item.cost_center.inactive",
        "The cost center is inactive.",
    )
    ENTRY_TEMPLATE_OTHER_COST_CENTER = (
        "billing_document_item.entry_template.other_cost_center",
        "The entry template belongs to another cost center.",
    )
    ENTRY_TEMPLATE_INACTIVE = (
        "billing_document_item.entry_template.inactive",
        "The entry template is inactive.",
    )
    DATA_IMMUTABLE = (
        "billing_document_item.data.immutable",
        "An item of a billing document cannot be changed.",
    )
