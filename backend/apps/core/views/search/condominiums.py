from typing import Any

from django.db.models import Q

from apps.condominiums.models import Condominium
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, any_of, exact_code, relevance_rank
from .term import ClassifiedTerm


def search_condominiums(user: Any, query: ClassifiedTerm) -> list[Condominium]:
    matching: list[Q] = []
    starts_with: list[Q] = []
    if query.matches_text:
        matching.append(Q(name__icontains=query.text))
        starts_with.append(Q(name__istartswith=query.text))
    if query.matches_document:
        matching.append(Q(cnpj__contains=query.digits))
        starts_with.append(Q(cnpj__startswith=query.digits))
    exact = exact_code(query)
    if exact is not None:
        matching.append(exact)
    return list(
        scope_to_company(Condominium.objects.all(), user)
        .filter(any_of(matching))
        .annotate(rank=relevance_rank(starts_with, exact))
        .select_related("address")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
