from dataclasses import dataclass
from datetime import date

from django.db import models
from django.db.models import Exists, OuterRef

from apps.condominiums.models import Unit, UnitPerson

from .adjustments import Adjustment, upcoming_adjustments
from .leases import leases_ending_soon
from .scoped_data import ScopedData


@dataclass(frozen=True)
class DashboardContext:
    """Everything the dashboard sections are computed from, for one reference date."""

    reference_date: date
    adjustments: list[Adjustment]
    leases: models.QuerySet[UnitPerson]
    active_units: models.QuerySet[Unit]
    units_with_responsible: models.QuerySet[Unit]
    units_without_responsible: models.QuerySet[Unit]

    @classmethod
    def for_date(cls, reference_date: date, data: ScopedData) -> "DashboardContext":
        has_current_link = Exists(
            UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk"))
        )
        active_units = data.units.filter(active=True)
        return cls(
            reference_date=reference_date,
            adjustments=upcoming_adjustments(reference_date, data.contracts),
            leases=leases_ending_soon(reference_date, data.unit_people),
            active_units=active_units,
            units_with_responsible=active_units.filter(has_current_link),
            units_without_responsible=data.units.without_responsible(reference_date),  # type: ignore[attr-defined]
        )
