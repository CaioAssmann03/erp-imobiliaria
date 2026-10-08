from typing import Any

from django.db.models import Q, Value
from django.db.models.functions import Coalesce

from apps.core.scoping import scope_to_company
from apps.persons.models import Person

from .ranking import LIMIT_PER_TYPE, relevance_rank


def search_persons(
    user: Any, term: str, digits: str, should_search_document: bool
) -> list[Person]:
    name_filter = Q(name__icontains=term)
    ranking = [Q(name__istartswith=term)]
    if should_search_document:
        name_filter |= Q(people_individual__cpf__contains=digits) | Q(
            people_legal__cnpj__contains=digits
        )
        ranking += [
            Q(people_individual__cpf__startswith=digits),
            Q(people_legal__cnpj__startswith=digits),
        ]
    return list(
        scope_to_company(Person.objects.all(), user)
        .filter(name_filter)
        .annotate(
            rank=relevance_rank(*ranking),
            document=Coalesce("people_individual__cpf", "people_legal__cnpj", Value("")),
        )
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
