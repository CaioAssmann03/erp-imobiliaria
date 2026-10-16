import uuid
from collections.abc import Mapping
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.db import models
from django.db.models import Exists, OuterRef, Sum
from django.db.models.functions import Coalesce

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit import Unit  # noqa: F401


def _fraction_total_alias(fraction_number: int) -> str:
    return f"fraction_{fraction_number}_total"


class UnitQuerySet(models.QuerySet["Unit"]):
    def _fraction_numbers(self) -> range:
        return range(1, len(self.model.IDEAL_FRACTION_FIELDS) + 1)

    def _fraction_totals(self) -> dict[str, Any]:
        """The sum of each ideal fraction, under the alias `fraction_<number>_total` (1 to 6)."""
        return {
            _fraction_total_alias(number): Coalesce(Sum(field_name), Decimal(0))
            for number, field_name in enumerate(self.model.IDEAL_FRACTION_FIELDS, start=1)
        }

    def apportionment_totals(self) -> list[Decimal]:
        """Sum of each of the six ideal fractions (the 1st first) over the active units of the queryset."""
        aggregates: dict[str, Decimal] = self.filter(active=True).aggregate(**self._fraction_totals())
        return [aggregates[_fraction_total_alias(number)] for number in self._fraction_numbers()]

    def inconsistent_apportionment_condominium_ids(self) -> list[uuid.UUID]:
        """Ids of condominiums whose active units' ideal fractions do not close at 1 (`Unit.is_apportionment_inconsistent`)."""
        sums = (
            self.filter(active=True, condominium__active=True)
            .values("condominium")
            .annotate(**self._fraction_totals())
        )
        return [row["condominium"] for row in sums if self._has_inconsistent_fraction(row)]

    def _has_inconsistent_fraction(self, totals_by_alias: Mapping[str, Any]) -> bool:
        return any(
            self.model.is_apportionment_inconsistent(number, totals_by_alias[_fraction_total_alias(number)])
            for number in self._fraction_numbers()
        )

    def without_responsible(self, reference_date: date) -> "UnitQuerySet":
        """Active units with no current owner or tenant: there is nobody to bill."""
        from apps.condominiums.models.unit_person import UnitPerson

        has_current_link = Exists(
            UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk"))
        )
        return self.filter(active=True).filter(~has_current_link)

    def with_lease_ending_soon(self, reference_date: date) -> "UnitQuerySet":
        """Units that have a tenant link ending soon (see `UnitPersonQuerySet.leases_ending_soon`)."""
        from apps.condominiums.models.unit_person import UnitPerson

        ending = UnitPerson.objects.leases_ending_soon(reference_date)
        return self.filter(pk__in=ending.values("unit"))
