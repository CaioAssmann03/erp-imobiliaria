from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import CondominiumBillingRules
from ..serializers import CondominiumBillingRulesSerializer


@final
class CondominiumBillingRulesViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[CondominiumBillingRules]):
    """How each condominium is billed: the issuance day, the due date and the late-payment terms."""

    queryset = CondominiumBillingRules.objects.order_by("condominium__name")
    serializer_class = CondominiumBillingRulesSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)
