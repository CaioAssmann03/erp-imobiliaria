import django_filters
from django.db.models import QuerySet
from typing_extensions import final

from .models import Person, PersonModule


@final
class PersonFilter(django_filters.FilterSet):
    """`?type=individual|legal` filtra pelo tipo de cadastro (CPF ou CNPJ).

    `?module=condominiums|rentals` lists only the people who belong to that module.
    """

    type = django_filters.ChoiceFilter(
        choices=(("individual", "Individual"), ("legal", "Legal")),
        method="filter_type",
    )
    module = django_filters.ChoiceFilter(
        choices=PersonModule.choices, method="filter_module"
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

    def filter_module(
        self, queryset: QuerySet[Person], name: str, value: str
    ) -> QuerySet[Person]:
        return queryset.filter(modules__contains=[value])
