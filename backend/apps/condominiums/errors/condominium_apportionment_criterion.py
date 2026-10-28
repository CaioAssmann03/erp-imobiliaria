from apps.core.infrastructure.errors.base import RuleError


class CondominiumApportionmentCriterionError(RuleError):
    NAME_DUPLICATE = (
        "condominium_apportionment_criterion.name.duplicate",
        "This condominium already has a criterion with this name.",
    )
    POSITION_DUPLICATE = (
        "condominium_apportionment_criterion.position.duplicate",
        "This condominium already has a criterion at this position.",
    )
    POSITION_OUT_OF_RANGE = (
        "condominium_apportionment_criterion.position.out_of_range",
        "The position must be 1 or more.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "condominium_apportionment_criterion.condominium.immutable",
        "The condominium of a criterion cannot be changed.",
    )
    DELETION_IS_MAIN = (
        "condominium_apportionment_criterion.deletion.is_main",
        "The main criterion cannot be deleted.",
    )
    DELETION_IN_USE = (
        "condominium_apportionment_criterion.deletion.in_use",
        "A criterion used by a unit fraction or a billing plan item cannot be deleted.",
    )
