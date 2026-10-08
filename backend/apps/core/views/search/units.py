from typing import Any

from django.db.models import Q

from apps.condominiums.models import Unit
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, relevance_rank


def search_units(user: Any, term: str) -> list[Unit]:
    return list(
        scope_to_company(Unit.objects.all(), user)
        .filter(name__icontains=term)
        .annotate(rank=relevance_rank(Q(name__istartswith=term)))
        .select_related("condominium")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
