from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.condominiums.models import Condominium
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin, scope_to_company

from ..filters import BillingRunFilter
from ..models import BillingRun
from ..serializers import BillingRunSerializer, IssuanceCoverageQuerySerializer, IssuanceCoverageSerializer
from ..services.build_issuance_coverage import build_issuance_coverage


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
    filterset_class = BillingRunFilter

    @extend_schema(
        parameters=[IssuanceCoverageQuerySerializer],
        responses=IssuanceCoverageSerializer,
        operation_id="billing_runs_coverage",
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def coverage(self, request: Request) -> Response:
        """The active condominiums, how many already have a boleto issued in `?reference_month=` and which do not (the dashboard): `missing` is one page of them (`?page=`, `?limit=`, 10 by default) and `missing_count` the total."""
        query = IssuanceCoverageQuerySerializer(data=request.query_params)
        _ = query.is_valid(raise_exception=True)
        condominiums = scope_to_company(Condominium.objects.filter(active=True), request.user)
        coverage = build_issuance_coverage(
            self.get_queryset(), condominiums, query.validated_data["reference_month"]
        )
        page = query.validated_data["page"]
        limit = query.validated_data["limit"]
        missing_count = coverage.expected - coverage.issued
        missing = coverage.missing[(page - 1) * limit : page * limit]
        payload = {"expected": coverage.expected, "issued": coverage.issued, "missing_count": missing_count, "missing": missing}
        return Response(IssuanceCoverageSerializer(payload).data)
