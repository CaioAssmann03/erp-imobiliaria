from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Sum
from django.db.models.functions import Coalesce

from apps.condominiums.errors import UnitError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit import Unit  # noqa: F401


class UnitRules(ModelRules["Unit"]):
    @rule("block", UnitError.BLOCK_OTHER_CONDOMINIUM)
    def block_belongs_to_another_condominium(self) -> bool:
        unit = self.instance
        block = unit.block
        if block is None:
            return False
        return block.condominium_id != unit.condominium_id

    @rule("ideal_fraction", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def apportionment_exceeds_total(self) -> bool:
        """The active units of a condominium cannot sum more than the total (reaching it is a pendency)."""
        unit = self.instance
        if not unit.active or unit.ideal_fraction is None or unit.condominium_id is None:
            return False
        other_units_total: Decimal = (
            type(unit)
            .objects.filter(condominium_id=unit.condominium_id, active=True)
            .exclude(pk=unit.pk)
            .aggregate(total=Coalesce(Sum("ideal_fraction"), Decimal(0)))["total"]
        )
        limit = unit.APPORTIONMENT_TOTAL + unit.APPORTIONMENT_TOLERANCE
        return other_units_total + unit.ideal_fraction > limit
