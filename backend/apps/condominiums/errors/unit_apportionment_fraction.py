from apps.core.infrastructure.errors.base import RuleError


class UnitApportionmentFractionError(RuleError):
    CRITERION_OTHER_CONDOMINIUM = (
        "unit_apportionment_fraction.criterion.other_condominium",
        "The criterion belongs to another condominium.",
    )
    CRITERION_DUPLICATE = (
        "unit_apportionment_fraction.criterion.duplicate",
        "The unit already has a fraction for this criterion.",
    )
