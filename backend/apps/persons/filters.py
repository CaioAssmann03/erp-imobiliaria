from typing import cast, final

import django_filters
from django.db.models import QuerySet

from .models import Person
from .models.querysets import PersonQuerySet
from .modules import module_choices


@final
class PersonFilter(django_filters.FilterSet):
    """`?type=individual|legal` filtra pelo tipo de cadastro (CPF ou CNPJ).

    `?person_module=` lists only the people released to that registered module.
    """

    type = django_filters.ChoiceFilter(
        choices=(("individual", "Individual"), ("legal", "Legal")),
        method="filter_type",
    )
    person_module = django_filters.ChoiceFilter(
        choices=module_choices, method="filter_person_module"
    )

    class Meta:
        model = Person
        fields = ("active",)

    def filter_type(
        self, queryset: QuerySet[Person], name: str, value: str
    ) -> QuerySet[Person]:
        if value == "individual":
            return queryset.filter(people_individual__isnull=False)
        return queryset.filter(people_legal__isnull=False)

    def filter_person_module(
        self, queryset: QuerySet[Person], name: str, value: str
    ) -> QuerySet[Person]:
        return cast(PersonQuerySet, queryset).in_module(value)
