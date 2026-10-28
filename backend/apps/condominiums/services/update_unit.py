from typing import Any

from django.db import transaction

from apps.condominiums.models import Unit
from apps.condominiums.services.set_unit_fractions import set_unit_fractions


@transaction.atomic
def update_unit(unit: Unit, unit_data: dict[str, Any]) -> Unit:
    """Update a unit and, when `fractions` is sent, replace its set of fractions (leaving it out keeps them)."""
    unit_fields = dict(unit_data)
    fractions = unit_fields.pop("fractions", None)

    for field_name, field_value in unit_fields.items():
        setattr(unit, field_name, field_value)
    unit.save()

    if fractions is not None:
        set_unit_fractions(unit, fractions)
    return unit
