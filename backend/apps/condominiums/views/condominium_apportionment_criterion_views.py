from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import CondominiumApportionmentCriterion
from ..serializers import CondominiumApportionmentCriterionSerializer


@final
class CondominiumApportionmentCriterionViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[CondominiumApportionmentCriterion]):
    queryset = CondominiumApportionmentCriterion.objects.select_related("condominium")
    serializer_class = CondominiumApportionmentCriterionSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)
