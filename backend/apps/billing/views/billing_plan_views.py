from typing import final

from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import BillingPlan, BillingPlanItem
from ..serializers import BillingPlanSerializer


@final
class BillingPlanViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[BillingPlan]):
    """Billing plans of the condominiums: what a unit's monthly boleto is made of."""

    queryset = BillingPlan.objects.select_related("condominium").prefetch_related(
        Prefetch(
            "items",
            queryset=BillingPlanItem.objects.select_related("event", "cost_center", "entry_template"),
        )
    )
    serializer_class = BillingPlanSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name",)
    filterset_fields = ("condominium", "active")
