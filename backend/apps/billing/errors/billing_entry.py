from apps.core.infrastructure.errors.base import RuleError


class BillingEntryError(RuleError):
    APPORTIONMENT_CRITERION_DOES_NOT_MATCH_ALLOCATION = (
        "billing_entry.apportionment_criterion.does_not_match_allocation",
        "A fraction entry names an apportionment criterion; the other allocations have none.",
    )
    APPORTIONMENT_CRITERION_OTHER_CONDOMINIUM = (
        "billing_entry.apportionment_criterion.other_condominium",
        "The apportionment criterion belongs to another condominium.",
    )
    INSTALLMENTS_TOTAL_DOES_NOT_MATCH_RECURRENCE = (
        "billing_entry.installments_total.does_not_match_recurrence",
        "An installment entry needs two or more installments; the other recurrences have none.",
    )
    END_MONTH_ONLY_FOR_ALWAYS = (
        "billing_entry.end_month.only_for_always",
        "Only an entry that repeats always can be ended.",
    )
    END_MONTH_BEFORE_START_MONTH = (
        "billing_entry.end_month.before_start_month",
        "The end month cannot be before the start month.",
    )
    EVENT_OTHER_COMPANY = (
        "billing_entry.event.other_company",
        "The event belongs to another company.",
    )
    EVENT_INACTIVE = (
        "billing_entry.event.inactive",
        "The event is inactive.",
    )
    COST_CENTER_OTHER_CONDOMINIUM = (
        "billing_entry.cost_center.other_condominium",
        "The cost center belongs to another condominium.",
    )
    COST_CENTER_REQUIRED = (
        "billing_entry.cost_center.required",
        "Choose the sub-conta where this value is credited.",
    )
    COST_CENTER_NOT_ALLOWED_FOR_COMPANY_EVENT = (
        "billing_entry.cost_center.not_allowed_for_company_event",
        "An event that credits the administradora has no sub-conta: its money never goes to a condominium.",
    )
    COST_CENTER_INACTIVE = (
        "billing_entry.cost_center.inactive",
        "The cost center is inactive.",
    )
    COST_CENTER_WITHOUT_ONE_ENTRY_TEMPLATE = (
        "billing_entry.cost_center.without_one_entry_template",
        "The cost center must have exactly one active entry template.",
    )
    ALREADY_USED = (
        "billing_entry.already_used",
        "A document was already issued from this entry; end it and create a new one instead.",
    )
    UNIT_OTHER_CONDOMINIUM = (
        "billing_entry.unit.other_condominium",
        "The unit belongs to another condominium.",
    )
    UNIT_AMOUNT_ONLY_FOR_INDIVIDUAL = (
        "billing_entry.unit.amount_only_for_individual",
        "Only an individual entry can give a unit its own amount.",
    )
    UNIT_WITHOUT_FRACTION = (
        "billing_entry.unit.without_fraction",
        "A selected unit has no fraction in the apportionment criterion of this entry.",
    )
    UNIT_DUPLICATE_IN_ENTRY = (
        "billing_entry.unit.duplicate_in_entry",
        "This unit is already in the entry.",
    )
    AMOUNT_NEGATIVE_FOR_COMPANY_EVENT = (
        "billing_entry.amount.negative_for_company_event",
        "A value of the administradora (the registration fee) cannot be a discount.",
    )
    UNIT_AMOUNT_SIGN_DIFFERS = (
        "billing_entry.unit.amount_sign_differs",
        "The unit's own value must have the same sign as the entry: a discount cannot charge a unit, nor a charge discount it.",
    )
