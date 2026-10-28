from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import BillingEvent
from ..serializers import BillingEventSerializer


@final
class BillingEventViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[BillingEvent]):
    """The events (code and name) that fill the description of a launch."""

    queryset = BillingEvent.objects.all()
    serializer_class = BillingEventSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name",)
    filterset_fields = ("active",)
