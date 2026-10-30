from typing import TYPE_CHECKING

from apps.condominiums.errors import BlockError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    from apps.condominiums.models.block import Block  # noqa: F401

NOT_A_FIELD = "__all__"


class BlockArchiveRules(ModelRules["Block"]):
    @rule(NOT_A_FIELD, BlockError.ARCHIVE_HAS_UNITS)
    def has_units(self) -> bool:
        return self.instance.units.exists()
