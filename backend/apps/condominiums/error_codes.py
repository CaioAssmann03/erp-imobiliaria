"""Stable error codes of the condominium rules (spec 006): `model.field.reason`."""

from enum import StrEnum


class CondominiumsErrorCode(StrEnum):
    # shared validators of this app
    DUE_DAY_OUT_OF_RANGE = "due_day.out_of_range"
    IDEAL_FRACTION_OUT_OF_RANGE = "ideal_fraction.out_of_range"
    VALUE_NEGATIVE = "value.negative"
    # Condominium
    CONDOMINIUM_ADVISOR_OTHER_COMPANY = "condominium.advisor.other_company"
    # AdministrationContract (one rule for the variable fee: percentage and basis together)
    CONTRACT_FEE_AMOUNT_REQUIRED_FOR_FIXED = "administration_contract.fee_amount.required_for_fixed"
    CONTRACT_VARIABLE_FEE_INCOMPLETE = "administration_contract.variable_fee.requires_percentage_and_basis"
    CONTRACT_FEE_FLOOR_EXCEEDS_CEILING = "administration_contract.fee_floor.exceeds_ceiling"
    # BillingRules
    BILLING_RULES_DUE_DAY_OUT_OF_RANGE = "billing_rules.due_day.out_of_range"
    BILLING_RULES_DISCOUNT_OUT_OF_RANGE = "billing_rules.early_payment_discount_percentage.out_of_range"
    # Block
    BLOCK_NAME_DUPLICATE_IN_CONDOMINIUM = "block.name.duplicate_in_condominium"
    # Unit
    UNIT_BLOCK_OTHER_CONDOMINIUM = "unit.block.other_condominium"
    UNIT_IDEAL_FRACTION_OUT_OF_RANGE = "unit.ideal_fraction.out_of_range"
    UNIT_IDEAL_FRACTION_SUM_EXCEEDS_TOTAL = "unit.ideal_fraction.sum_exceeds_total"
    UNIT_NAME_DUPLICATE_IN_BLOCK = "unit.name.duplicate_in_block"
    UNIT_NAME_DUPLICATE_IN_CONDOMINIUM = "unit.name.duplicate_in_condominium"
    UNIT_UTILITY_VALUES_NEGATIVE = "unit.utility_values.negative"
    # UnitPerson
    UNIT_PERSON_END_DATE_BEFORE_START_DATE = "unit_person.end_date.before_start_date"
    UNIT_PERSON_PERCENTAGE_REQUIRED_FOR_OWNER = "unit_person.ownership_percentage.required_for_owner"
    UNIT_PERSON_PERCENTAGE_NOT_ALLOWED_FOR_TENANT = "unit_person.ownership_percentage.not_allowed_for_tenant"
    UNIT_PERSON_PERCENTAGE_SUM_EXCEEDS_100 = "unit_person.ownership_percentage.sum_exceeds_100"
    UNIT_PERSON_DUPLICATE_ACTIVE_LINK = "unit_person.person.duplicate_active_link"
    UNIT_PERSON_PERSON_OTHER_COMPANY = "unit_person.person.other_company"
