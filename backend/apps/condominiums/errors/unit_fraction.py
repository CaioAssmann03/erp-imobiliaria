from apps.core.infrastructure.errors.base import RuleError


class UnitFractionError(RuleError):
    CRITERION_OTHER_CONDOMINIUM = (
        "unit_fraction.criterion.other_condominium",
        "The criterion belongs to another condominium.",
    )
    CRITERION_DUPLICATE = (
        "unit_fraction.criterion.duplicate",
        "The unit already has a fraction for this criterion.",
    )
