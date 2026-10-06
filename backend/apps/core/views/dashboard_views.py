from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, TypedDict, cast

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
from apps.condominiums.models.querysets import UnitPersonQuerySet
from apps.core.dates import add_months
from apps.core.scoping import scope_to_company
from apps.finance.models import AccountPayable
from apps.finance.models.querysets import AccountPayableQuerySet
from apps.persons.models import Person

from ..serializers import DashboardSerializer

ADJUSTMENT_MONTHS = 6  # meses futuros exibidos no gráfico de reajustes
TOP_LIST = 6
PAYABLE_DAYS_AHEAD = 7  # dias: janela de "vencem nos próximos dias"


@dataclass(frozen=True)
class ScopedData:
    """The records the dashboard reads, already limited to the user's company (spec 004)."""

    condominiums: models.QuerySet[Condominium]
    units: models.QuerySet[Unit]
    persons: models.QuerySet[Person]
    contracts: models.QuerySet[AdministrationContract]
    unit_people: models.QuerySet[UnitPerson]
    accounts_payable: AccountPayableQuerySet

    @classmethod
    def for_user(cls, user: Any) -> "ScopedData":
        return cls(
            condominiums=scope_to_company(Condominium.objects.all(), user),
            units=scope_to_company(Unit.objects.all(), user),
            persons=scope_to_company(Person.objects.all(), user),
            contracts=scope_to_company(AdministrationContract.objects.all(), user),
            unit_people=scope_to_company(UnitPerson.objects.all(), user),
            accounts_payable=cast(
                AccountPayableQuerySet, scope_to_company(AccountPayable.objects.all(), user)
            ),
        )


class Adjustment(TypedDict):
    id: object
    name: str
    date: date
    adjustment_index: str
    overdue: bool




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


def _persons_summary(persons: models.QuerySet[Person]) -> dict[str, object]:
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


def _upcoming_adjustments(
    reference_date: date, all_contracts: models.QuerySet[AdministrationContract]
) -> list[Adjustment]:
    """Próximo reajuste de cada condomínio ativo: base + periodicidade (ordenado por data)."""
    contracts = all_contracts.filter(
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
                "adjustment_index": contract.adjustment_index,
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


def _fixed_revenue(
    all_contracts: models.QuerySet[AdministrationContract],
) -> dict[str, object]:
    contracts = all_contracts.filter(condominium__active=True)
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


def _leases_ending_soon(
    reference_date: date, unit_people: models.QuerySet[UnitPerson]
) -> models.QuerySet[UnitPerson]:
    ending = cast(UnitPersonQuerySet, unit_people).leases_ending_soon(reference_date)
    return ending.select_related("unit__condominium", "person").order_by("end_date")


@dataclass(frozen=True)
class DashboardContext:
    """Everything the dashboard sections are computed from, for one reference date."""

    reference_date: date
    adjustments: list[Adjustment]
    leases: models.QuerySet[UnitPerson]
    active_units: models.QuerySet[Unit]
    units_with_responsible: models.QuerySet[Unit]
    units_without_responsible: models.QuerySet[Unit]

    @classmethod
    def for_date(cls, reference_date: date, data: ScopedData) -> "DashboardContext":
        has_current_link = Exists(
            UnitPerson.objects.current(reference_date).filter(unit=OuterRef("pk"))
        )
        active_units = data.units.filter(active=True)
        return cls(
            reference_date=reference_date,
            adjustments=_upcoming_adjustments(reference_date, data.contracts),
            leases=_leases_ending_soon(reference_date, data.unit_people),
            active_units=active_units,
            units_with_responsible=active_units.filter(has_current_link),
            units_without_responsible=data.units.without_responsible(reference_date),  # type: ignore[attr-defined]
        )


def _responsibles(context: DashboardContext) -> dict[str, int]:
    return {
        "active_units": context.active_units.count(),
        "with_responsible": context.units_with_responsible.count(),
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


def _pending_counters(context: DashboardContext, data: ScopedData) -> dict[str, int]:
    inconsistent_ids = Unit.objects.inconsistent_apportionment_condominium_ids()
    return {
        "units_without_responsible": context.units_without_responsible.count(),
        "inconsistent_apportionment": data.condominiums.filter(
            pk__in=inconsistent_ids
        ).count(),
        "overdue_adjustments": len(
            data.contracts.overdue_adjustment_condominium_ids(context.reference_date)  # type: ignore[attr-defined]
        ),
        "adjustments_next_30_days": len(
            data.contracts.upcoming_adjustment_condominium_ids(context.reference_date)  # type: ignore[attr-defined]
        ),
        "leases_ending": context.leases.count(),
        "without_cost_centers": data.condominiums.without_cost_centers().count(),  # type: ignore[attr-defined]
        "billing_blocked_units": data.units.filter(
            active=True, is_billing_blocked=True
        ).count(),
    }


def _payable_total(accounts: AccountPayableQuerySet) -> dict[str, object]:
    aggregate = accounts.aggregate(count=Count("pk"), total=Sum("amount"))
    return {"count": aggregate["count"], "total": aggregate["total"] or Decimal("0")}


def _accounts_payable(
    reference_date: date, accounts: AccountPayableQuerySet
) -> dict[str, Any]:
    """Open accounts to pay by due window (company expenses included) and the oldest ones."""
    month_start = reference_date.replace(day=1)
    month_end = add_months(month_start, 1) - timedelta(days=1)
    upcoming = (
        accounts.open()
        .select_related("supplier__person", "condominium")
        .order_by("due_date", "created_at")[:TOP_LIST]
    )
    return {
        "overdue": _payable_total(accounts.overdue(reference_date)),
        "due_today": _payable_total(accounts.due_between(reference_date, reference_date)),
        "due_next_7_days": _payable_total(
            accounts.due_between(
                reference_date + timedelta(days=1),
                reference_date + timedelta(days=PAYABLE_DAYS_AHEAD),
            )
        ),
        "due_this_month": _payable_total(accounts.due_between(month_start, month_end)),
        "upcoming": [
            {
                "id": account.pk,
                "description": account.description,
                "supplier_name": account.supplier.person.name,
                "condominium_name": (
                    account.condominium.name if account.condominium is not None else None
                ),
                "due_date": account.due_date,
                "amount": account.amount,
                "overdue": account.due_date < reference_date,
            }
            for account in upcoming
        ],
    }


@final
class DashboardView(APIView):
    """Indicadores do painel inicial: o que pede ação (não apenas totais de cadastro)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request: Request) -> Response:
        data = ScopedData.for_user(request.user)
        context = DashboardContext.for_date(timezone.localdate(), data)

        dashboard: dict[str, Any] = {
            "condominiums": _summary(data.condominiums, "type", Condominium.CondominiumType),
            "units": _summary(data.units, "type", Unit.UnitType),
            "persons": _persons_summary(data.persons),
            "responsibles": _responsibles(context),
            "adjustments_by_month": _adjustments_by_month(
                context.adjustments, context.reference_date
            ),
            "upcoming_adjustments": context.adjustments[:TOP_LIST],
            "fixed_revenue": _fixed_revenue(data.contracts),
            "leases": _lease_entries(context),
            "pending": _pending_counters(context, data),
            "accounts_payable": _accounts_payable(
                context.reference_date, data.accounts_payable
            ),
        }
        return Response(DashboardSerializer(dashboard).data)
