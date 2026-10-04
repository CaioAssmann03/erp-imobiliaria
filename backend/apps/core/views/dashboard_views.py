import calendar
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, TypedDict

from django.db import models
from django.db.models import Count, Exists, OuterRef, Q, Sum, TextChoices
from django.db.models.functions import Coalesce
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
from apps.persons.models import Person

from ..serializers import DashboardSerializer

ADJUSTMENT_MONTHS = 6  # meses futuros exibidos no gráfico de reajustes
LEASE_DAYS_BEFORE = 30  # dias: locações já encerradas ainda exibidas (renovação pendente)
LEASE_DAYS_AFTER = 60  # dias: locações que terminam em breve
APPORTIONMENT_TOTAL = Decimal("1")
APPORTIONMENT_TOLERANCE = Decimal("0.0001")
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


def _add_months(origin: date, months: int) -> date:
    index = origin.month - 1 + months
    year, month = origin.year + index // 12, index % 12 + 1
    return date(year, month, min(origin.day, calendar.monthrange(year, month)[1]))


def _adjustments(today: date) -> list[Adjustment]:
    """Próximo reajuste de cada condomínio ativo: base + periodicidade (ordenado por data)."""
    contracts = AdministrationContract.objects.filter(
        condominium__active=True, adjustment_base_date__isnull=False
    ).select_related("condominium")
    items: list[Adjustment] = []
    for contract in contracts:
        assert contract.adjustment_base_date is not None
        due = _add_months(
            contract.adjustment_base_date, contract.adjustment_period_months
        )
        items.append(
            {
                "id": contract.condominium_id,
                "name": contract.condominium.name,
                "date": due,
                "index": contract.adjustment_index,
                "overdue": due < today,
            }
        )
    return sorted(items, key=lambda item: item["date"])


def _adjustments_by_month(
    adjustments: list[Adjustment], today: date
) -> list[dict[str, Any]]:
    months = [_add_months(today.replace(day=1), i) for i in range(ADJUSTMENT_MONTHS)]
    counts = {month.strftime("%Y-%m"): 0 for month in months}
    overdue = 0
    for item in adjustments:
        key = item["date"].strftime("%Y-%m")
        if item["overdue"]:
            overdue += 1
        elif key in counts:
            counts[key] += 1
    return [{"month": "overdue", "total": overdue}] + [
        {"month": month, "total": total} for month, total in counts.items()
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


def _active_links(today: date) -> Q:
    return Q(end_date__isnull=True) | Q(end_date__gte=today)


def _leases(today: date):  # noqa: ANN202
    return (
        UnitPerson.objects.filter(
            role=UnitPerson.Role.TENANT,
            unit__active=True,
            end_date__isnull=False,
            end_date__gte=today - timedelta(days=LEASE_DAYS_BEFORE),
            end_date__lte=today + timedelta(days=LEASE_DAYS_AFTER),
        )
        .select_related("unit__condominium", "person")
        .order_by("end_date")
    )


def _inconsistent_apportionment() -> int:
    sums = (
        Unit.objects.filter(active=True, condominium__active=True)
        .values("condominium")
        .annotate(total=Coalesce(Sum("ideal_fraction"), Decimal("0")))
    )
    return sum(
        1
        for row in sums
        if abs(row["total"] - APPORTIONMENT_TOTAL) > APPORTIONMENT_TOLERANCE
    )


@final
class DashboardView(APIView):
    """Indicadores do painel inicial: o que pede ação (não apenas totais de cadastro)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        today = timezone.localdate()
        adjustments = _adjustments(today)
        leases = _leases(today)

        active_units = Unit.objects.filter(active=True).annotate(
            has_responsible=Exists(
                UnitPerson.objects.filter(unit=OuterRef("pk")).filter(
                    _active_links(today)
                )
            )
        )

        data: dict[str, Any] = {
            "condominiums": _summary(
                Condominium.objects.all(), "type", Condominium.CondominiumType
            ),
            "units": _summary(Unit.objects.all(), "type", Unit.UnitType),
            "persons": _persons_summary(),
            "responsibles": {
                "active_units": active_units.count(),
                "with_responsible": active_units.filter(has_responsible=True).count(),
            },
            "adjustments_by_month": _adjustments_by_month(adjustments, today),
            "upcoming_adjustments": adjustments[:TOP_LIST],
            "fixed_revenue": _fixed_revenue(),
            "leases": [
                {
                    "id": link.unit_id,
                    "condominium": link.unit.condominium_id,
                    "condominium_name": link.unit.condominium.name,
                    "unit": link.unit.name,
                    "tenant": link.person.name,
                    "end_date": link.end_date,
                    "ended": link.end_date is not None and link.end_date < today,
                }
                for link in leases[:TOP_LIST]
            ],
            "pending": {
                "units_without_responsible": active_units.filter(
                    has_responsible=False
                ).count(),
                "inconsistent_apportionment": _inconsistent_apportionment(),
                "overdue_adjustments": sum(1 for a in adjustments if a["overdue"]),
                "adjustments_next_30_days": sum(
                    1
                    for a in adjustments
                    if today <= a["date"] <= today + timedelta(days=30)
                ),
                "leases_ending": leases.count(),
                "without_cost_centers": Condominium.objects.filter(
                    active=True, cost_centers__isnull=True
                ).count(),
                "billing_blocked_units": Unit.objects.filter(
                    active=True, is_billing_blocked=True
                ).count(),
            },
        }
        return Response(DashboardSerializer(data).data)
