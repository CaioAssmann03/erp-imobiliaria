from typing import final

from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import CostCenterCatalogItem
from ..serializers import CostCenterCatalogItemSerializer


@final
class CostCenterCatalogItemViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[CostCenterCatalogItem]):
    """The administradora's catalog of sub-contas: a code and a name once; the condominiums use them (spec 053)."""

    queryset = CostCenterCatalogItem.objects.annotate(cost_center_count=Count("cost_centers"))
    serializer_class = CostCenterCatalogItemSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name",)
    filterset_fields = ("active",)
