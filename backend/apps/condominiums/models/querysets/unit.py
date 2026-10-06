import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Exists, OuterRef, Sum
from django.db.models.functions import Coalesce

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit import Unit  # noqa: F401


class UnitQuerySet(models.QuerySet["Unit"]):
    def inconsistent_apportionment_condominium_ids(self) -> list[uuid.UUID]:
        """Ids of condominiums whose active units' ideal fractions do not sum to 1."""
        sums = (
            self.filter(active=True, condominium__active=True)
            .values("condominium")
            .annotate(total=Coalesce(Sum("ideal_fraction"), Decimal(0)))
        )
        return [
            row["condominium"]
            for row in sums
            if abs(row["total"] - self.model.APPORTIONMENT_TOTAL)
            > self.model.APPORTIONMENT_TOLERANCE
        ]

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
