from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from typing_extensions import final

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import CondominiumFilter
from ..models import Condominium, Unit
from ..serializers import ApportionmentSerializer, CondominiumSerializer


@final
class CondominiumViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Condominium]):
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
    search_code_field = "code"
    filterset_class = CondominiumFilter

    @extend_schema(responses=ApportionmentSerializer, operation_id="condominiums_apportionment")
    @action(detail=True, methods=["get"])
    def apportionment(self, request: Request, pk: str | None = None) -> Response:
        """The sum of each ideal fraction over the active units, and whether it closes at 1."""
        units = Unit.objects.filter(condominium=self.get_object())
        active_units = units.filter(active=True).count()
        fractions = [
            {
                "number": number,
                "total": total,
                # A condominium with no active unit has nothing to apportion yet.
                "is_inconsistent": active_units > 0 and Unit.is_apportionment_inconsistent(number, total),
            }
            for number, total in enumerate(units.apportionment_totals(), start=1)
        ]
        return Response(ApportionmentSerializer({"active_units": active_units, "fractions": fractions}).data)
