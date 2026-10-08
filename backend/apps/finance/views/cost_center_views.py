from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import CostCenter
from ..serializers import CostCenterSerializer


@final
class CostCenterViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[CostCenter]):
    queryset = CostCenter.objects.select_related("condominium")
    serializer_class = CostCenterSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name",)
    filterset_fields = ("condominium", "active")
