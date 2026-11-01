from typing import final

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.generics import GenericAPIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.api.pagination import StandardPagination

from .adjustments.data import upcoming_adjustments
from .adjustments.serializers import UpcomingAdjustmentSerializer
from .fixed_revenue.data import fee_row
from .fixed_revenue.serializers import CondominiumFeeSerializer
from .scoped_data import ScopedData


@final
class UpcomingAdjustmentListView(GenericAPIView[None]):
    """Every condominium's next adjustment, by date, paginated (the dashboard card shows only the first few)."""

    serializer_class = UpcomingAdjustmentSerializer
    pagination_class = StandardPagination

    @extend_schema(responses=UpcomingAdjustmentSerializer(many=True), operation_id="dashboard_adjustments_list")
    def get(self, request: Request) -> Response:
        data = ScopedData.for_user(request.user)
        page = self.paginate_queryset(upcoming_adjustments(timezone.localdate(), data.contracts))  # type: ignore[arg-type]
        return self.get_paginated_response(UpcomingAdjustmentSerializer(page, many=True).data)


@final
class LargestFeeListView(GenericAPIView[None]):
    """The active condominiums with a fixed fee, the largest first, paginated (the dashboard card shows only the top few)."""

    serializer_class = CondominiumFeeSerializer
    pagination_class = StandardPagination

    @extend_schema(responses=CondominiumFeeSerializer(many=True), operation_id="dashboard_largest_fees_list")
    def get(self, request: Request) -> Response:
        data = ScopedData.for_user(request.user)
        contracts = data.contracts.of_active_condominiums().largest_fixed_fees()
        page = self.paginate_queryset(contracts)  # type: ignore[arg-type]
        return self.get_paginated_response(CondominiumFeeSerializer([fee_row(contract) for contract in page or []], many=True).data)
