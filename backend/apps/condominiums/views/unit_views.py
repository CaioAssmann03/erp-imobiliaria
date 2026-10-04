from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.filters import QuerySearchFilter

from ..models import Unit
from ..serializers import UnitSerializer


@final
class UnitViewSet(viewsets.ModelViewSet[Unit]):
    queryset = Unit.objects.select_related("condominium", "block").prefetch_related(
        "unit_people__person__people_individual",
        "unit_people__person__people_legal",
    )
    serializer_class = UnitSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "registration_number")
    filterset_fields = ("condominium", "block", "active", "type", "is_billing_blocked")
