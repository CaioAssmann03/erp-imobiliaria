from datetime import date
from typing import Any, TypedDict

from django.db import models

from apps.condominiums.models import AdministrationContract
from apps.core.dates import add_months

ADJUSTMENT_MONTHS = 6  # meses futuros exibidos no gráfico de reajustes


class Adjustment(TypedDict):
    id: object
    name: str
    date: date
    adjustment_index: str
    overdue: bool


def upcoming_adjustments(
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


def adjustments_by_month(
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
