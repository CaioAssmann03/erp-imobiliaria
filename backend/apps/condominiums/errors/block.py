from apps.core.infrastructure.errors.base import RuleError


class BlockError(RuleError):
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "block.name.duplicate_in_condominium",
        "This condominium already has a block with this name.",
    )
    ARCHIVE_HAS_UNITS = (
        "block.archive.has_units",
        "This block still has units; delete them first.",
    )
