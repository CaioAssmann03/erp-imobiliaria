from datetime import date

from typing import Any, TypedDict

from apps.condominiums.models.querysets import AdministrationContractQuerySet
from apps.core.infrastructure.dates import add_months

ADJUSTMENT_MONTHS = 6 
UPCOMING_ADJUSTMENTS_LIMIT = 6


class Adjustment(TypedDict):
    id: object
    name: str
    date: date
    adjustment_index: str
    overdue: bool


def upcoming_adjustments(
    reference_date: date, all_contracts: AdministrationContractQuerySet
) -> list[Adjustment]:
    """Próximo reajuste de cada condomínio ativo: base + periodicidade (ordenado por data)."""
    contracts = (
        all_contracts.of_active_condominiums()
        .with_scheduled_adjustment()
        .select_related("condominium")
    )
    adjustments: list[Adjustment] = []
    for contract in contracts:
        next_date = contract.next_adjustment_date()
        if next_date is None:
            continue
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
