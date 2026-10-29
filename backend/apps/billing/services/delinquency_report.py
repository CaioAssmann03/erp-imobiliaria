from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final
from uuid import UUID

from django.db.models import Count, QuerySet, Sum

from apps.billing.models import BillingDocument

ROW_LIMIT = 2000


@final
@dataclass(frozen=True)
class DelinquencyRow:
    document_id: UUID
    condominium_id: UUID
    condominium_name: str
    unit_name: str
    payer_name: str
    reference_month: date
    due_date: date
    days_overdue: int
    amount: Decimal


@final
@dataclass(frozen=True)
class DelinquencyCondominiumTotal:
    condominium_id: UUID
    condominium_name: str
    count: int
    total_amount: Decimal


@final
@dataclass(frozen=True)
class DelinquencyReport:
    as_of: date
    count: int
    total_amount: Decimal
    by_condominium: list[DelinquencyCondominiumTotal]
    rows: list[DelinquencyRow]
    # True when `rows` holds only the first `ROW_LIMIT`; the totals always cover every overdue document.
    truncated: bool


def build_delinquency_report(documents: QuerySet[BillingDocument], as_of: date) -> DelinquencyReport:
    """The boletos still awaiting payment whose due date is before `as_of`, with the days late and the totals.

    `documents` is already limited to what the user may see (company, filters). The amount is the boleto's
    face value: the gateway computes the fine and the interest only when it is paid.
    """
    overdue = documents.prefetch_related(None).overdue_on(as_of)  # type: ignore[attr-defined]
    ordered = overdue.select_related("unit__condominium", "unit__block", "payer").order_by(
        "unit__condominium__name", "due_date", "unit__name", "id"
    )
    fetched = list(ordered[: ROW_LIMIT + 1])
    rows = [
        DelinquencyRow(
            document_id=document.id,
            condominium_id=document.unit.condominium_id,
            condominium_name=document.unit.condominium.name,
            unit_name=document.unit.display_name,
            payer_name=document.payer.name,
            reference_month=document.reference_month,
            due_date=document.due_date,
            days_overdue=(as_of - document.due_date).days,
            amount=document.amount,
        )
        for document in fetched[:ROW_LIMIT]
    ]
    by_condominium = [
        DelinquencyCondominiumTotal(
            condominium_id=line["unit__condominium"],
            condominium_name=line["unit__condominium__name"],
            count=line["count"],
            total_amount=line["total"],
        )
        for line in overdue.order_by()
        .values("unit__condominium", "unit__condominium__name")
        .annotate(count=Count("id"), total=Sum("amount"))
        .order_by("unit__condominium__name")
    ]
    return DelinquencyReport(
        as_of=as_of,
        count=sum(line.count for line in by_condominium),
        total_amount=sum((line.total_amount for line in by_condominium), Decimal(0)),
        by_condominium=by_condominium,
        rows=rows,
        truncated=len(fetched) > ROW_LIMIT,
    )
