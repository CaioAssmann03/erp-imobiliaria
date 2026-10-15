from typing import Any

from django.db.models import Q

from apps.condominiums.models import Unit
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, relevance_rank
from .term import ClassifiedTerm


def search_units(user: Any, query: ClassifiedTerm) -> list[Unit]:
    """A unit has no ID: it is found by its number. A single digit only asks for an ID."""
    if not query.matches_text:
        return []
    return list(
        scope_to_company(Unit.objects.all(), user)
        .filter(name__icontains=query.text)
        .annotate(rank=relevance_rank([Q(name__istartswith=query.text)], None))
        .select_related("condominium")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
