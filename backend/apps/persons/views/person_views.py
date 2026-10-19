from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import PersonFilter
from ..models import Person
from ..serializers import PersonSerializer


@final
class PersonViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Person]):
    queryset = Person.objects.select_related("people_individual", "people_legal")
    serializer_class = PersonSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "email", "people_individual__cpf", "people_legal__cnpj")
    search_code_field = "code"
    filterset_class = PersonFilter
