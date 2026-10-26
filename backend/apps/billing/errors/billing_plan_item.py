from apps.core.infrastructure.errors.base import RuleError


class BillingPlanItemError(RuleError):
    POSITION_DUPLICATE_IN_PLAN = (
        "billing_plan_item.position.duplicate_in_plan",
        "This plan already has an item at this position.",
    )
    AMOUNT_DOES_NOT_MATCH_KIND = (
        "billing_plan_item.amount.does_not_match_kind",
        "Fixed and share items need an amount; an item that reads the unit's value has none.",
    )
    APPORTIONMENT_CRITERION_DOES_NOT_MATCH_KIND = (
        "billing_plan_item.apportionment_criterion.does_not_match_kind",
        "A share item names an apportionment criterion; the other kinds have none.",
    )
    APPORTIONMENT_CRITERION_OTHER_CONDOMINIUM = (
        "billing_plan_item.apportionment_criterion.other_condominium",
        "The apportionment criterion belongs to another condominium.",
    )
    UNIT_VALUE_FIELD_DOES_NOT_MATCH_KIND = (
        "billing_plan_item.unit_value_field.does_not_match_kind",
        "An item that reads the unit's value names gas, water or electricity; the other kinds have none.",
    )
    COST_CENTER_OTHER_CONDOMINIUM = (
        "billing_plan_item.cost_center.other_condominium",
        "The cost center belongs to another condominium.",
    )
    COST_CENTER_INACTIVE = (
        "billing_plan_item.cost_center.inactive",
        "The cost center is inactive.",
    )
    ENTRY_TEMPLATE_OTHER_COST_CENTER = (
        "billing_plan_item.entry_template.other_cost_center",
        "The entry template belongs to another cost center.",
    )
    ENTRY_TEMPLATE_INACTIVE = (
        "billing_plan_item.entry_template.inactive",
        "The entry template is inactive.",
    )
