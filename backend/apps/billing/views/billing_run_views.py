from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import BillingRun
from ..serializers import BillingRunSerializer


@final
class BillingRunViewSet(
    CompanyScopedViewSetMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet[BillingRun],
):
    """Executions of the monthly issuance: list them, or issue a condominium's month now."""

    queryset = BillingRun.objects.select_related("condominium")
    serializer_class = BillingRunSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium", "reference_month", "status")
