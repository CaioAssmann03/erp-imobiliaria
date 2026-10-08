from typing import Any

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final

from apps.condominiums.models import Condominium, Unit
from apps.core.serializers import DashboardSerializer

from .accounts_payable import accounts_payable
from .adjustments import adjustments_by_month
from .constants import TOP_LIST
from .context import DashboardContext
from .fixed_revenue import fixed_revenue
from .leases import lease_entries
from .pending import pending_counters
from .responsibles import count_responsibles
from .scoped_data import ScopedData
from .summaries import summarize_by_type, summarize_persons


@final
class DashboardView(APIView):
    """Indicadores do painel inicial: o que pede ação (não apenas totais de cadastro)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        data = ScopedData.for_user(request.user)
        context = DashboardContext.for_date(timezone.localdate(), data)

        dashboard: dict[str, Any] = {
            "condominiums": summarize_by_type(
                data.condominiums, "type", Condominium.CondominiumType
            ),
            "units": summarize_by_type(data.units, "type", Unit.UnitType),
            "persons": summarize_persons(data.persons),
            "responsibles": count_responsibles(context),
            "adjustments_by_month": adjustments_by_month(
                context.adjustments, context.reference_date
            ),
            "upcoming_adjustments": context.adjustments[:TOP_LIST],
            "fixed_revenue": fixed_revenue(data.contracts),
            "leases": lease_entries(context.leases, context.reference_date),
            "pending": pending_counters(context, data),
            "accounts_payable": accounts_payable(
                context.reference_date, data.accounts_payable
            ),
        }
        return Response(DashboardSerializer(dashboard).data)
