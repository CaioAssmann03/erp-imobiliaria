from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.condominium_apportionment_criterion import CondominiumApportionmentCriterion  # noqa: F401
    from apps.condominiums.models.querysets.unit import UnitQuerySet


class CondominiumApportionmentCriterionQuerySet(models.QuerySet["CondominiumApportionmentCriterion"]):
    def main(self) -> "CondominiumApportionmentCriterionQuerySet":
        return self.filter(position=self.model.MAIN_POSITION)

    def with_total(self, units: "UnitQuerySet | None" = None) -> "CondominiumApportionmentCriterionQuerySet":
        """Each criterion with `total`: the sum of its fractions over the active units (0 when nobody has one).

        `units` limits the sum to the active units of that queryset instead of every active unit.
        """
        counted_units = (
            Q(unit_fractions__unit__active=True)
            if units is None
            else Q(unit_fractions__unit__in=units.active())
        )
        total = Coalesce(Sum("unit_fractions__value", filter=counted_units), 0, output_field=models.DecimalField())
        # `total` is declared on the model for the type checker, which also sees the annotation as a redefinition.
        return self.annotate(total=total)  # type: ignore[no-redef]

    def inconsistent(self, units: "UnitQuerySet | None" = None) -> "CondominiumApportionmentCriterionQuerySet":
        """The criteria that do not close at 1 and have to: the main one always, the others once in use
        (the same rule as `CondominiumApportionmentCriterion.is_inconsistent`, evaluated by the database)."""
        lowest_total = self.model.TOTAL - self.model.TOLERANCE
        highest_total = self.model.TOTAL + self.model.TOLERANCE
        has_to_close = Q(position=self.model.MAIN_POSITION) | Q(total__gt=0)
        does_not_close = Q(total__lt=lowest_total) | Q(total__gt=highest_total)
        return self.with_total(units).filter(has_to_close & does_not_close)
