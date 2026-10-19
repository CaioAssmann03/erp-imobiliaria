from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import LateInterestRate
from ..serializers import LateInterestRateSerializer


@final
class LateInterestRateViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[LateInterestRate]):
    queryset = LateInterestRate.objects.all()
    serializer_class = LateInterestRateSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)
