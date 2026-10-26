from typing import Any

from django.db import transaction

from apps.condominiums.models import Unit
from apps.condominiums.services.set_unit_fractions import set_unit_fractions


@transaction.atomic
def create_unit(unit_data: dict[str, Any]) -> Unit:
    """Create a unit and, when `fractions` is sent, its set of fractions."""
    unit_fields = dict(unit_data)
    fractions = unit_fields.pop("fractions", None)

    unit = Unit.objects.create(**unit_fields)

    if fractions is not None:
        set_unit_fractions(unit, fractions)
    return unit
