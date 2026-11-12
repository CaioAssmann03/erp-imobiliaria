from typing import TYPE_CHECKING

from apps.condominiums.errors import CondominiumError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    from apps.condominiums.models.condominium import Condominium  # noqa: F401

NOT_A_FIELD = "__all__"


class CondominiumArchiveRules(ModelRules["Condominium"]):
    """What must be true before a condominium is deleted (archived): it is inactive and nothing live hangs from it.

    The order is the order the staff has to follow: units, then blocks, then sub-contas, then the condominium.
    """

    @rule(NOT_A_FIELD, CondominiumError.ARCHIVE_STILL_ACTIVE)
    def is_still_active(self) -> bool:
        return self.instance.active

    @rule(NOT_A_FIELD, CondominiumError.ARCHIVE_HAS_UNITS)
    def has_units(self) -> bool:
        return self.instance.units.exists()

    @rule(NOT_A_FIELD, CondominiumError.ARCHIVE_HAS_BLOCKS)
    def has_blocks(self) -> bool:
        return self.instance.blocks.exists()

    @rule(NOT_A_FIELD, CondominiumError.ARCHIVE_HAS_COST_CENTERS)
    def has_cost_centers(self) -> bool:
        return self.instance.cost_centers.exists()

    @rule(NOT_A_FIELD, CondominiumError.ARCHIVE_HAS_OPEN_ACCOUNTS_PAYABLE)
    def has_open_accounts_payable(self) -> bool:
        accounts_payable = self.instance.accounts_payable
        return accounts_payable.filter(status=accounts_payable.model.Status.OPEN).exists()
