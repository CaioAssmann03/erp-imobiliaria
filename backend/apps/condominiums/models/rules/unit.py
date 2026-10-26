from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Sum
from django.db.models.functions import Coalesce

from apps.condominiums.errors import UnitError
from apps.condominiums.models.apportionment_criterion import ApportionmentCriterion
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

    @rule("active", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def reactivation_exceeds_total(self) -> bool:
        """Turning an inactive unit back on counts its fractions again, so they must still fit in 1."""
        unit = self.instance
        if not unit.active or unit._state.adding:
            return False
        if not type(unit).objects.filter(pk=unit.pk, active=False).exists():
            return False
        limit = ApportionmentCriterion.TOTAL + ApportionmentCriterion.TOLERANCE
        for fraction in unit.fractions.all():
            other_units_total: Decimal = (
                type(fraction)
                .objects.filter(criterion_id=fraction.criterion_id, unit__active=True)
                .exclude(unit_id=unit.pk)
                .aggregate(total=Coalesce(Sum("value"), Decimal(0)))["total"]
            )
            if other_units_total + fraction.value > limit:
                return True
        return False
