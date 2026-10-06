from apps.core.errors.base import RuleError


class UnitError(RuleError):
    BLOCK_OTHER_CONDOMINIUM = (
        "unit.block.other_condominium",
        "Block belongs to another condominium.",
    )
    IDEAL_FRACTION_OUT_OF_RANGE = (
        "unit.ideal_fraction.out_of_range",
        "Ideal fraction must be greater than 0 and at most 1.",
    )
    IDEAL_FRACTION_SUM_EXCEEDS_TOTAL = (
        "unit.ideal_fraction.sum_exceeds_total",
        "Ideal fractions of the condominium's active units would exceed 1.",
    )
    NAME_DUPLICATE_IN_BLOCK = (
        "unit.name.duplicate_in_block",
        "This block already has a unit with this name.",
    )
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "unit.name.duplicate_in_condominium",
        "This condominium already has a unit with this name.",
    )
    UTILITY_VALUES_NEGATIVE = (
        "unit.utility_values.negative",
        "Utility values cannot be negative.",
    )
