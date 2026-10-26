from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import ApportionmentCriterion
from ..serializers import ApportionmentCriterionSerializer


@final
class ApportionmentCriterionViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[ApportionmentCriterion]):
    queryset = ApportionmentCriterion.objects.select_related("condominium")
    serializer_class = ApportionmentCriterionSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)
