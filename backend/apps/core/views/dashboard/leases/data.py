from datetime import date
from typing import Any

from django.db import models

from apps.condominiums.models import UnitPerson
from apps.condominiums.models.querysets import UnitPersonQuerySet

ENDING_LEASES_LIMIT = 6  


def leases_ending_soon(
    reference_date: date, unit_people: UnitPersonQuerySet
) -> models.QuerySet[UnitPerson]:
    ending = unit_people.leases_ending_soon(reference_date)
    return ending.select_related("unit__condominium", "person").order_by("end_date")


def lease_entries(
    leases: models.QuerySet[UnitPerson], reference_date: date
) -> list[dict[str, Any]]:
    return [
        {
            "id": link.unit_id,
            "condominium": link.unit.condominium_id,
            "condominium_name": link.unit.condominium.name,
            "unit": link.unit.name,
            "tenant": link.person.name,
            "end_date": link.end_date,
            "ended": link.end_date is not None and link.end_date < reference_date,
        }
        for link in leases[:ENDING_LEASES_LIMIT]
    ]
