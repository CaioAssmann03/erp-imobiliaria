from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.filters import QuerySearchFilter

from ..models import Person
from ..serializers import PersonSerializer


@final
class PersonViewSet(viewsets.ModelViewSet[Person]):
    queryset = Person.objects.select_related("people_individual", "people_legal")
    serializer_class = PersonSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "email", "people_individual__cpf", "people_legal__cnpj")
    filterset_fields = ("active",)
