import uuid
from datetime import date
from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, Q

from apps.core.infrastructure.search.ranking import relevance_rank
from apps.core.models import SoftDeleteQuerySet
from apps.core.models.querysets import CountsByTypeQuerySet

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit import Unit  # noqa: F401
    from apps.core.infrastructure.search.term import ClassifiedTerm


class UnitQuerySet(CountsByTypeQuerySet["Unit"], SoftDeleteQuerySet["Unit"]):
    def active(self) -> "UnitQuerySet":
        return self.filter(active=True)

    def inconsistent_apportionment_condominium_ids(self) -> list[uuid.UUID]:
        """Ids of condominiums with an active unit whose criteria have a pendency (`CondominiumApportionmentCriterion.is_inconsistent`)."""
        from apps.condominiums.models.condominium_apportionment_criterion import (
            CondominiumApportionmentCriterion,
        )

        active_units = self.active().filter(condominium__active=True)
        criteria = CondominiumApportionmentCriterion.objects.filter(
            condominium__in=active_units.values("condominium")
        ).inconsistent(active_units)
        return list(
            criteria.order_by().values_list("condominium_id", flat=True).distinct()
        )

    def _has_current_link(self, reference_date: date) -> Exists:
        from apps.condominiums.models.unit_person import UnitPerson

        return Exists(
            UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk"))
        )

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
