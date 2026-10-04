from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.filters import QuerySearchFilter

from ..models import Condominium
from ..serializers import CondominiumSerializer


@final
class CondominiumViewSet(viewsets.ModelViewSet[Condominium]):
    queryset = Condominium.objects.select_related(
        "company",
        "advisor",
        "address",
        "administration_contract",
        "billing_rules",
    )
    serializer_class = CondominiumSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "cnpj", "address__city")
    filterset_fields = ("company", "advisor", "active", "type", "address__state")
