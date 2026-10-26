from typing import Any

from django.db import transaction

from apps.condominiums.models import Unit, UnitFraction


@transaction.atomic
def set_unit_fractions(unit: Unit, fractions: list[dict[str, Any]]) -> None:
    """Make `fractions` ([{criterion, value}]) the unit's whole set: others are removed, the rest are
    created or updated, and every row is validated by the model rules only once all are written, so
    swapping 0.6/0.4 for 0.4/0.6 is not refused halfway. A row the rules refuse raises the model's
    `ValidationError` and the whole change is rolled back."""
    # The sum rule reads the other units' rows: lock the condominium's units so two requests cannot both pass it.
    # Locked in primary-key order, which also keeps two requests from waiting on each other.
    _ = list(
        Unit.objects.select_for_update(of=("self",))
        .filter(condominium_id=unit.condominium_id)
        .order_by("pk")
        .values_list("pk", flat=True)
    )

    value_by_criterion_id = {fraction["criterion"].pk: fraction["value"] for fraction in fractions}
    _ = unit.fractions.exclude(criterion_id__in=value_by_criterion_id).delete()
    saved_fractions = [
        UnitFraction.objects.update_or_create(unit=unit, criterion_id=criterion_id, defaults={"value": value})[0]
        for criterion_id, value in value_by_criterion_id.items()
    ]
    for fraction in saved_fractions:
        fraction.full_clean()
