from typing import Any

from django.db.models import Q

from apps.condominiums.models import Condominium
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, relevance_rank


def search_condominiums(
    user: Any, term: str, digits: str, should_search_document: bool
) -> list[Condominium]:
    name_filter = Q(name__icontains=term)
    ranking = [Q(name__istartswith=term)]
    if should_search_document:
        name_filter |= Q(cnpj__contains=digits)
        ranking.append(Q(cnpj__startswith=digits))
    return list(
        scope_to_company(Condominium.objects.all(), user)
        .filter(name_filter)
        .annotate(rank=relevance_rank(*ranking))
        .select_related("address")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
