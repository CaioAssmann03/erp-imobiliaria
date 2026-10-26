from apps.core.infrastructure.errors.base import RuleError


class ApportionmentCriterionError(RuleError):
    NAME_DUPLICATE = (
        "apportionment_criterion.name.duplicate",
        "This condominium already has a criterion with this name.",
    )
    POSITION_DUPLICATE = (
        "apportionment_criterion.position.duplicate",
        "This condominium already has a criterion at this position.",
    )
    POSITION_OUT_OF_RANGE = (
        "apportionment_criterion.position.out_of_range",
        "The position must be 1 or more.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "apportionment_criterion.condominium.immutable",
        "The condominium of a criterion cannot be changed.",
    )
    DELETION_IS_MAIN = (
        "apportionment_criterion.deletion.is_main",
        "The main criterion cannot be deleted.",
    )
    DELETION_IN_USE = (
        "apportionment_criterion.deletion.in_use",
        "A criterion used by a unit fraction or a billing plan item cannot be deleted.",
    )
