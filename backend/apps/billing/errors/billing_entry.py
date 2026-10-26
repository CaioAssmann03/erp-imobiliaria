from apps.core.errors.base import RuleError


class BillingEntryError(RuleError):
    IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_ALLOCATION = (
        "billing_entry.ideal_fraction_number.does_not_match_allocation",
        "A fraction entry names an ideal fraction; the other allocations have none.",
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
    DESCRIPTION_TOO_LONG = (
        "billing_entry.description.too_long",
        "Event name and description together are too long for a boleto line.",
    )
    UNITS_EMPTY = (
        "billing_entry.units.empty",
        "Select at least one unit.",
    )
    UNIT_OTHER_CONDOMINIUM = (
        "billing_entry.unit.other_condominium",
        "The unit belongs to another condominium.",
    )
    UNIT_AMOUNT_ONLY_FOR_INDIVIDUAL = (
        "billing_entry.unit.amount_only_for_individual",
        "Only an individual entry can give a unit its own amount.",
    )
    UNIT_WITHOUT_IDEAL_FRACTION = (
        "billing_entry.unit.without_ideal_fraction",
        "A selected unit has no value for the ideal fraction of this entry.",
    )
    UNIT_DUPLICATE_IN_ENTRY = (
        "billing_entry.unit.duplicate_in_entry",
        "This unit is already in the entry.",
    )
