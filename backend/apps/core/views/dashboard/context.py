from dataclasses import dataclass
from datetime import date

from django.db import models

from apps.condominiums.models import Unit, UnitPerson

from .adjustments.data import Adjustment, upcoming_adjustments
from .leases.data import leases_ending_soon
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
        return cls(
            reference_date=reference_date,
            adjustments=upcoming_adjustments(reference_date, data.contracts),
            leases=leases_ending_soon(reference_date, data.unit_people),
            active_units=data.units.active(),
            units_with_responsible=data.units.with_responsible(reference_date),
            units_without_responsible=data.units.without_responsible(reference_date),
        )
