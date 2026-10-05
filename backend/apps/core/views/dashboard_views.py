from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, TypedDict

from django.db import models
from django.db.models import Count, Exists, OuterRef, Q, Sum, TextChoices
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final

from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.dates import add_months
from apps.persons.models import Person

from ..serializers import DashboardSerializer

ADJUSTMENT_MONTHS = 6  # meses futuros exibidos no gráfico de reajustes
LEASE_DAYS_BEFORE = 30  # dias: locações já encerradas ainda exibidas (renovação pendente)
LEASE_DAYS_AFTER = 60  # dias: locações que terminam em breve
NEXT_ADJUSTMENTS_ALERT_DAYS = 30  # dias: janela do contador "reajustes em 30 dias"
TOP_LIST = 6


class Adjustment(TypedDict):
    id: object
    name: str
    date: date
    index: str
    overdue: bool


# ----- cálculos -----


def _summary(
    queryset: "models.QuerySet[Any]", type_field: str, types: type[TextChoices]
) -> dict[str, object]:
    """Total, ativos e contagem por tipo (todos os tipos aparecem, mesmo com 0)."""
    aggregate = queryset.aggregate(
        total=Count("pk"), active=Count("pk", filter=Q(active=True))
    )
    counts = dict(queryset.values_list(type_field).annotate(n=Count("pk")))
    return {
        **aggregate,
        "by_type": [
            {"type": value, "title": title, "total": counts.get(value, 0)}
            for value, title in types.choices
        ],
    }


def _persons_summary() -> dict[str, object]:
    persons = Person.objects.all()
    aggregate = persons.aggregate(
        total=Count("pk"),
        active=Count("pk", filter=Q(active=True)),
        individual=Count("pk", filter=Q(people_individual__isnull=False)),
        legal=Count("pk", filter=Q(people_legal__isnull=False)),
    )
    return {
        "total": aggregate["total"],
        "active": aggregate["active"],
        "by_type": [
            {
                "type": "individual",
                "title": "Individual",
                "total": aggregate["individual"],
            },
            {"type": "legal", "title": "Legal", "total": aggregate["legal"]},
        ],
    }


def _upcoming_adjustments(reference_date: date) -> list[Adjustment]:
    """Próximo reajuste de cada condomínio ativo: base + periodicidade (ordenado por data)."""
    contracts = AdministrationContract.objects.filter(
        condominium__active=True, adjustment_base_date__isnull=False
    ).select_related("condominium")
    adjustments: list[Adjustment] = []
    for contract in contracts:
        next_date = contract.next_adjustment_date()
        assert next_date is not None
        adjustments.append(
            {
                "id": contract.condominium_id,
                "name": contract.condominium.name,
                "date": next_date,
                "index": contract.adjustment_index,
                "overdue": contract.is_adjustment_overdue(reference_date),
            }
        )
    return sorted(adjustments, key=lambda adjustment: adjustment["date"])


def _adjustments_by_month(
    adjustments: list[Adjustment], reference_date: date
) -> list[dict[str, Any]]:
    first_of_month = reference_date.replace(day=1)
    months = [add_months(first_of_month, offset) for offset in range(ADJUSTMENT_MONTHS)]
    totals_by_month = {month.strftime("%Y-%m"): 0 for month in months}
    overdue_total = 0
    for adjustment in adjustments:
        month_key = adjustment["date"].strftime("%Y-%m")
        if adjustment["overdue"]:
            overdue_total += 1
        elif month_key in totals_by_month:
            totals_by_month[month_key] += 1
    return [{"month": "overdue", "total": overdue_total}] + [
        {"month": month, "total": total} for month, total in totals_by_month.items()
    ]


def _fixed_revenue() -> dict[str, object]:
    contracts = AdministrationContract.objects.filter(condominium__active=True)
    fixed = contracts.filter(fee_type=AdministrationContract.FeeType.FIXED)
    total = fixed.aggregate(total=Sum("fee_amount"))["total"] or Decimal("0")
    largest = fixed.filter(fee_amount__gt=0).select_related("condominium")
    return {
        "monthly_total": total,
        "fixed_condominiums": fixed.count(),
        "variable_condominiums": contracts.filter(
            fee_type=AdministrationContract.FeeType.VARIABLE
        ).count(),
        "largest": [
            {
                "id": c.condominium_id,
                "name": c.condominium.name,
                "amount": c.fee_amount,
            }
            for c in largest.order_by("-fee_amount")[:8]
        ],
    }


def _leases_ending_soon(reference_date: date):  # noqa: ANN202
    return (
        UnitPerson.objects.filter(
            role=UnitPerson.Role.TENANT,
            unit__active=True,
            end_date__isnull=False,
            end_date__gte=reference_date - timedelta(days=LEASE_DAYS_BEFORE),
            end_date__lte=reference_date + timedelta(days=LEASE_DAYS_AFTER),
        )
        .select_related("unit__condominium", "person")
        .order_by("end_date")
    )


@dataclass(frozen=True)
class DashboardContext:
    """Everything the dashboard sections are computed from, for one reference date."""

    reference_date: date
    adjustments: list[Adjustment]
    leases: models.QuerySet[UnitPerson]
    active_units: models.QuerySet[Unit]  # annotated with `has_responsible`

    @classmethod
    def for_date(cls, reference_date: date) -> "DashboardContext":
        active_units = Unit.objects.filter(active=True).annotate(
            has_responsible=Exists(
                UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk"))
            )
        )
        return cls(
            reference_date=reference_date,
            adjustments=_upcoming_adjustments(reference_date),
            leases=_leases_ending_soon(reference_date),
            active_units=active_units,
        )


def _responsibles(context: DashboardContext) -> dict[str, int]:
    return {
        "active_units": context.active_units.count(),
        "with_responsible": context.active_units.filter(has_responsible=True).count(),
    }


def _lease_entries(context: DashboardContext) -> list[dict[str, Any]]:
    return [
        {
            "id": link.unit_id,
            "condominium": link.unit.condominium_id,
            "condominium_name": link.unit.condominium.name,
            "unit": link.unit.name,
            "tenant": link.person.name,
            "end_date": link.end_date,
            "ended": link.end_date is not None and link.end_date < context.reference_date,
        }
        for link in context.leases[:TOP_LIST]
    ]


def _adjustments_due_within_alert_window(context: DashboardContext) -> int:
    window_end = context.reference_date + timedelta(days=NEXT_ADJUSTMENTS_ALERT_DAYS)
    return sum(
        1
        for adjustment in context.adjustments
        if context.reference_date <= adjustment["date"] <= window_end
    )


def _pending_counters(context: DashboardContext) -> dict[str, int]:
    return {
        "units_without_responsible": context.active_units.filter(has_responsible=False).count(),
        "inconsistent_apportionment": len(
            Unit.objects.inconsistent_apportionment_condominium_ids()
        ),
        "overdue_adjustments": sum(
            1 for adjustment in context.adjustments if adjustment["overdue"]
        ),
        "adjustments_next_30_days": _adjustments_due_within_alert_window(context),
        "leases_ending": context.leases.count(),
        "without_cost_centers": Condominium.objects.filter(
            active=True, cost_centers__isnull=True
        ).count(),
        "billing_blocked_units": Unit.objects.filter(
            active=True, is_billing_blocked=True
        ).count(),
    }


@final
class DashboardView(APIView):
    """Indicadores do painel inicial: o que pede ação (não apenas totais de cadastro)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        context = DashboardContext.for_date(timezone.localdate())

        dashboard: dict[str, Any] = {
            "condominiums": _summary(
                Condominium.objects.all(), "type", Condominium.CondominiumType
            ),
            "units": _summary(Unit.objects.all(), "type", Unit.UnitType),
            "persons": _persons_summary(),
            "responsibles": _responsibles(context),
            "adjustments_by_month": _adjustments_by_month(
                context.adjustments, context.reference_date
            ),
            "upcoming_adjustments": context.adjustments[:TOP_LIST],
            "fixed_revenue": _fixed_revenue(),
            "leases": _lease_entries(context),
            "pending": _pending_counters(context),
        }
        return Response(DashboardSerializer(dashboard).data)
