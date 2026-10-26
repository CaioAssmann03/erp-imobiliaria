import uuid
from collections.abc import Mapping
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.db.models import Exists, OuterRef, Q, Sum
from django.db.models.functions import Coalesce

from apps.core.infrastructure.search.ranking import relevance_rank

from .counts_by_type import CountsByTypeQuerySet

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit import Unit  # noqa: F401
    from apps.core.infrastructure.search.term import ClassifiedTerm


def _fraction_total_alias(fraction_number: int) -> str:
    return f"fraction_{fraction_number}_total"


class UnitQuerySet(CountsByTypeQuerySet["Unit"]):
    def active(self) -> "UnitQuerySet":
        return self.filter(active=True)

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
        aggregates: dict[str, Decimal] = self.active().aggregate(**self._fraction_totals())
        return [aggregates[_fraction_total_alias(number)] for number in self._fraction_numbers()]

    def inconsistent_apportionment_condominium_ids(self) -> list[uuid.UUID]:
        """Ids of condominiums whose active units' ideal fractions do not close at 1 (`Unit.is_apportionment_inconsistent`)."""
        sums = (
            self.active().filter(condominium__active=True)
            .values("condominium")
            .annotate(**self._fraction_totals())
        )
        return [row["condominium"] for row in sums if self._has_inconsistent_fraction(row)]

    def _has_inconsistent_fraction(self, totals_by_alias: Mapping[str, Any]) -> bool:
        return any(
            self.model.is_apportionment_inconsistent(number, totals_by_alias[_fraction_total_alias(number)])
            for number in self._fraction_numbers()
        )

    def _has_current_link(self, reference_date: date) -> Exists:
        from apps.condominiums.models.unit_person import UnitPerson

        return Exists(UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk")))

    def with_responsible(self, reference_date: date) -> "UnitQuerySet":
        """Active units with a current owner or tenant."""
        return self.active().filter(self._has_current_link(reference_date))

    def without_responsible(self, reference_date: date) -> "UnitQuerySet":
        """Active units with no current owner or tenant: there is nobody to bill."""
        return self.active().filter(~self._has_current_link(reference_date))

    def billing_blocked(self) -> "UnitQuerySet":
        """Active units whose billing is blocked."""
        return self.active().filter(is_billing_blocked=True)

    def with_lease_ending_soon(self, reference_date: date) -> "UnitQuerySet":
        """Units that have a tenant link ending soon (see `UnitPersonQuerySet.leases_ending_soon`)."""
        from apps.condominiums.models.unit_person import UnitPerson

        ending = UnitPerson.objects.leases_ending_soon(reference_date)
        return self.filter(pk__in=ending.values("unit"))

    def search(self, query: "ClassifiedTerm") -> "UnitQuerySet":
        """Units whose number matches the global search term, the best match first.

        A unit has no ID, so a term that only asks for an ID (a single digit) finds none.
        """
        if not query.matches_text:
            return self.none()
        return (
            self.filter(name__icontains=query.text)
            .annotate(rank=relevance_rank([Q(name__istartswith=query.text)], None))
            .select_related("condominium")
            .order_by("rank", "name")
        )
