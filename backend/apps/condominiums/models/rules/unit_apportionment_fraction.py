from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Sum
from django.db.models.functions import Coalesce

from apps.condominiums.errors import UnitApportionmentFractionError, UnitError
from apps.condominiums.models.condominium_apportionment_criterion import (
    CondominiumApportionmentCriterion,
)
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit_apportionment_fraction import (
        UnitApportionmentFraction,  # noqa: F401
    )


class UnitApportionmentFractionRules(ModelRules["UnitApportionmentFraction"]):
    @rule("criterion", UnitApportionmentFractionError.CRITERION_OTHER_CONDOMINIUM)
    def criterion_belongs_to_another_condominium(self) -> bool:
        fraction = self.instance
        if fraction.criterion_id is None or fraction.unit_id is None:
            return False
        return fraction.criterion.condominium_id != fraction.unit.condominium_id

    @rule("value", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def sum_exceeds_total(self) -> bool:
        """The active units of a condominium cannot sum more than the total in one criterion (reaching it is a pendency)."""
        fraction = self.instance
        if (
            fraction.criterion_id is None
            or fraction.unit_id is None
            or fraction.value is None
        ):
            return False
        unit = fraction.unit
        if not unit.active:
            return False
        other_units_total: Decimal = (
            type(fraction)
            .objects.filter(criterion_id=fraction.criterion_id, unit__active=True)
            .exclude(unit_id=fraction.unit_id)
            .aggregate(total=Coalesce(Sum("value"), Decimal(0)))["total"]
        )
        limit = (
            CondominiumApportionmentCriterion.TOTAL
            + CondominiumApportionmentCriterion.TOLERANCE
        )
        return other_units_total + fraction.value > limit
