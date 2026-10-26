from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Count, Q, Value
from django.db.models.functions import Coalesce

from apps.core.infrastructure.search.ranking import any_of, exact_code, relevance_rank
from apps.persons.modules import membership_relation_name

if TYPE_CHECKING:
    from apps.core.infrastructure.search.term import ClassifiedTerm
    from apps.persons.models.person import Person  # noqa: F401


class PersonQuerySet(models.QuerySet["Person"]):
    def in_module(self, module: str) -> "PersonQuerySet":
        """The people released to `module`: one join on the module's unique membership, no duplicates."""
        return self.filter(**{f"{membership_relation_name(module)}__isnull": False})

    def totals(self) -> dict[str, int]:
        """How many people there are, how many are active and how many are individuals or legal entities."""
        return self.aggregate(
            total=Count("pk"),
            active=Count("pk", filter=Q(active=True)),
            individual=Count("pk", filter=Q(people_individual__isnull=False)),
            legal=Count("pk", filter=Q(people_legal__isnull=False)),
        )

    def search(self, query: "ClassifiedTerm") -> "PersonQuerySet":
        """People matching the global search term (name, CPF/CNPJ or ID), the best match first."""
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

        return (
            self.filter(any_of(matching))
            .annotate(
                rank=relevance_rank(starts_with, exact),
                document=Coalesce(
                    "people_individual__cpf", "people_legal__cnpj", Value("")
                ),
            )
            .order_by("rank", "name")
        )
