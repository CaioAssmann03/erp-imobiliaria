from typing import Any, final

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.condominiums.models import Condominium, Unit

from .accounts_payable.data import accounts_payable
from .adjustments.data import UPCOMING_ADJUSTMENTS_LIMIT, adjustments_by_month
from .context import DashboardContext
from .fixed_revenue.data import fixed_revenue
from .leases.data import lease_entries
from .pending.data import pending_counters
from .registrations.data import summarize_by_type, summarize_persons
from .responsibles.data import count_responsibles
from .scoped_data import ScopedData
from .serializers import DashboardSerializer


@final
class DashboardView(APIView):

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        data = ScopedData.for_user(request.user)
        context = DashboardContext.for_date(timezone.localdate(), data)

        dashboard: dict[str, Any] = {
            "condominiums": summarize_by_type(
                data.condominiums, Condominium.CondominiumType
            ),
            "units": summarize_by_type(data.units, Unit.UnitType),
            "persons": summarize_persons(data.persons),
            "responsibles": count_responsibles(context),
            "adjustments_by_month": adjustments_by_month(
                context.adjustments, context.reference_date
            ),
            "upcoming_adjustments": context.adjustments[:UPCOMING_ADJUSTMENTS_LIMIT],
            "fixed_revenue": fixed_revenue(data.contracts),
            "leases": lease_entries(context.leases, context.reference_date),
            "pending": pending_counters(context, data),
            "accounts_payable": accounts_payable(
                context.reference_date, data.accounts_payable
            ),
        }
        return Response(DashboardSerializer(dashboard).data)
