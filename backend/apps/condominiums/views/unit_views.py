from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..filters import UnitFilter
from ..models import Unit
from ..serializers import UnitSerializer


@final
class UnitViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Unit]):
    queryset = Unit.objects.select_related("condominium", "block").prefetch_related(
        "unit_people__person__people_individual",
        "unit_people__person__people_legal",
    )
    serializer_class = UnitSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "registration_number")
    filterset_class = UnitFilter
