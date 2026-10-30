from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final
from uuid import UUID

from django.db.models import Count, QuerySet, Sum

from apps.billing.models import BillingDocument

ROW_LIMIT = 2000
PAGE_SIZE = 10
MAX_PAGE_SIZE = 100


@final
@dataclass(frozen=True)
class DelinquencyPage:
    """The page of rows the screen asks for: its number (1-based) and how many rows a page holds."""

    number: int = 1
    size: int = PAGE_SIZE


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
    # Which page `rows` is, how many rows a page holds and how many pages the overdue documents make (one page holds the whole list without `page`).
    page: int
    page_size: int
    page_count: int


def build_delinquency_report(documents: QuerySet[BillingDocument], as_of: date, page: DelinquencyPage | None = None) -> DelinquencyReport:
    """The boletos still awaiting payment whose due date is before `as_of`, with the days late and the totals.

    `documents` is already limited to what the user may see (company, filters). The amount is the boleto's
    face value: the gateway computes the fine and the interest only when it is paid. With `page` the rows are that
    page (`page.size` rows, 10 by default; the screen); without it they are the whole list up to `ROW_LIMIT` (the PDF).
    """
    overdue = documents.prefetch_related(None).overdue_on(as_of)  # type: ignore[attr-defined]
    ordered = overdue.select_related("unit__condominium", "unit__block", "payer").order_by(
        "unit__condominium__code", "due_date", "unit__name", "id"
    )
    if page is None:
        fetched = list(ordered[: ROW_LIMIT + 1])
        shown = fetched[:ROW_LIMIT]
    else:
        fetched = shown = list(ordered[(page.number - 1) * page.size : page.number * page.size])
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
        for document in shown
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
        .order_by("unit__condominium__code")
    ]
    count = sum(line.count for line in by_condominium)
    return DelinquencyReport(
        as_of=as_of,
        count=count,
        total_amount=sum((line.total_amount for line in by_condominium), Decimal(0)),
        by_condominium=by_condominium,
        rows=rows,
        truncated=page is None and len(fetched) > ROW_LIMIT,
        page=page.number if page is not None else 1,
        page_size=page.size if page is not None else ROW_LIMIT,
        page_count=max(-(-count // page.size), 1) if page is not None else 1,
    )
