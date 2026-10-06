from apps.core.errors.base import RuleError


class BlockError(RuleError):
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "block.name.duplicate_in_condominium",
        "This condominium already has a block with this name.",
    )
