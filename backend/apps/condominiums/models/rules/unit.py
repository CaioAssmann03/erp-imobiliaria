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

    # One rule per fraction, because a rule reports its error on exactly one field. The six share
    # the code of the error; the field in the answer says which fraction would pass the total.
    @rule("ideal_fraction", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def apportionment_exceeds_total(self) -> bool:
        """The active units of a condominium cannot sum more than the total (reaching it is a pendency)."""
        return self._fraction_sum_exceeds_total("ideal_fraction")

    @rule("ideal_fraction_2", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def second_apportionment_exceeds_total(self) -> bool:
        return self._fraction_sum_exceeds_total("ideal_fraction_2")

    @rule("ideal_fraction_3", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def third_apportionment_exceeds_total(self) -> bool:
        return self._fraction_sum_exceeds_total("ideal_fraction_3")

    @rule("ideal_fraction_4", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def fourth_apportionment_exceeds_total(self) -> bool:
        return self._fraction_sum_exceeds_total("ideal_fraction_4")

    @rule("ideal_fraction_5", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def fifth_apportionment_exceeds_total(self) -> bool:
        return self._fraction_sum_exceeds_total("ideal_fraction_5")

    @rule("ideal_fraction_6", UnitError.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL)
    def sixth_apportionment_exceeds_total(self) -> bool:
        return self._fraction_sum_exceeds_total("ideal_fraction_6")

    def _fraction_sum_exceeds_total(self, field_name: str) -> bool:
        unit = self.instance
        fraction: Decimal | None = getattr(unit, field_name)
        if not unit.active or fraction is None or unit.condominium_id is None:
            return False
        other_units_total: Decimal = (
            type(unit)
            .objects.filter(condominium_id=unit.condominium_id, active=True)
            .exclude(pk=unit.pk)
            .aggregate(total=Coalesce(Sum(field_name), Decimal(0)))["total"]
        )
        limit = unit.APPORTIONMENT_TOTAL + unit.APPORTIONMENT_TOLERANCE
        return other_units_total + fraction > limit
