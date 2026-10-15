from typing import Any

from django.db.models import Q, Value
from django.db.models.functions import Coalesce

from apps.core.scoping import scope_to_company
from apps.persons.models import Person

from .ranking import LIMIT_PER_TYPE, any_of, exact_code, relevance_rank
from .term import ClassifiedTerm


def search_persons(user: Any, query: ClassifiedTerm, module: str | None) -> list[Person]:
    matching: list[Q] = []
    starts_with: list[Q] = []
    if query.matches_text:
        matching.append(Q(name__icontains=query.text))
        starts_with.append(Q(name__istartswith=query.text))
    if query.matches_document:
        matching += [
            Q(people_individual__cpf__contains=query.digits),
            Q(people_legal__cnpj__contains=query.digits),
        ]
        starts_with += [
            Q(people_individual__cpf__startswith=query.digits),
            Q(people_legal__cnpj__startswith=query.digits),
        ]
    exact = exact_code(query)
    if exact is not None:
        matching.append(exact)

    people = scope_to_company(Person.objects.all(), user)
    if module is not None:
        people = people.filter(modules__contains=[module])
    return list(
        people.filter(any_of(matching))
        .annotate(
            rank=relevance_rank(starts_with, exact),
            document=Coalesce("people_individual__cpf", "people_legal__cnpj", Value("")),
        )
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
