from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..filters import UnitPersonFilter
from ..models import UnitPerson
from ..serializers import UnitPersonSerializer


@final
class UnitPersonViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[UnitPerson]):
    queryset = UnitPerson.objects.select_related("unit", "person__people_individual", "person__people_legal")
    serializer_class = UnitPersonSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("person__name", "person__email", "person__people_individual__cpf", "person__people_legal__cnpj")
    search_code_field = "person__code"
    filterset_class = UnitPersonFilter
