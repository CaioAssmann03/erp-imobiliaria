from apps.core.infrastructure.errors.base import RuleError


class EntryTemplateError(RuleError):
    ADMIN_FEE_PERCENTAGE_OUT_OF_RANGE = (
        "entry_template.admin_fee_incidence_percentage.out_of_range",
        "Percentage must be between 0 and 100.",
    )
    NAME_DUPLICATE_IN_COST_CENTER = (
        "entry_template.name.duplicate_in_cost_center",
        "This cost center already has an entry template with this name.",
    )
    COST_CENTER_IMMUTABLE = (
        "entry_template.cost_center.immutable",
        "The cost center of an entry template cannot be changed.",
    )
