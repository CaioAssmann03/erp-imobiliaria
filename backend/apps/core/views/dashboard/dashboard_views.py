from datetime import date
from typing import Any, final

from django.core.cache import cache
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

DASHBOARD_CACHE_SECONDS = 60


@final
class DashboardView(APIView):
    """The dashboard of the user's company; the numbers may be up to a minute old (24 queries to build)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        reference_date = timezone.localdate()
        cache_key = f"dashboard:{request.user.company_id}:{reference_date.isoformat()}"
        body = cache.get(cache_key)
        if body is None:
            body = self._build(request, reference_date)
            cache.set(cache_key, body, DASHBOARD_CACHE_SECONDS)
        return Response(body)

    def _build(self, request: Request, reference_date: date) -> dict[str, Any]:
        data = ScopedData.for_user(request.user)
        context = DashboardContext.for_date(reference_date, data)

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
        return dict(DashboardSerializer(dashboard).data)
