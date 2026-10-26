from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

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
        """The sum of each criterion's fractions over the active units, and whether it closes at 1."""
        condominium = self.get_object()
        units = Unit.objects.filter(condominium=condominium)
        active_units = units.filter(active=True).count()
        criteria = [
            {
                "criterion": criterion.pk,
                "name": criterion.name,
                "position": criterion.position,
                "total": criterion.total,
                # A condominium with no active unit has nothing to apportion yet.
                "is_inconsistent": active_units > 0 and criterion.is_inconsistent(criterion.total),
            }
            # A query that sums ignores the model's ordering, so the order is asked for here.
            for criterion in condominium.apportionment_criteria.with_total().order_by("position")
        ]
        return Response(ApportionmentSerializer({"active_units": active_units, "criteria": criteria}).data)
