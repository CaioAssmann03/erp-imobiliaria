from datetime import date, timedelta
from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models import Q

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit_person import UnitPerson  # noqa: F401


LEASE_DAYS_BEFORE = 30  # days: leases already ended that still show (renewal pending)
LEASE_DAYS_AFTER = 60  # days: leases that end soon


class UnitPersonQuerySet(models.QuerySet["UnitPerson"]):
    def current(self, reference_date: date) -> Self:
        return self.filter(Q(end_date__isnull=True) | Q(end_date__gte=reference_date))

    def leases_ending_soon(self, reference_date: date) -> Self:
        """Tenant links of active units that ended up to 30 days ago or end within 60 days."""
        return self.filter(
            role=self.model.Role.TENANT,
            unit__active=True,
            end_date__isnull=False,
            end_date__gte=reference_date - timedelta(days=LEASE_DAYS_BEFORE),
            end_date__lte=reference_date + timedelta(days=LEASE_DAYS_AFTER),
        )
