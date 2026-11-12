from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Literal, final
from uuid import UUID

from django.db.models import Count, Min, OuterRef, QuerySet, Subquery, Sum

from apps.billing.models import BillingDocument

ROW_LIMIT = 2000
PAGE_SIZE = 10
MAX_PAGE_SIZE = 100


RowsOrder = Literal["condominium", "oldest"]
CondominiumsOrder = Literal["code", "amount"]
UnitsOrder = Literal["condominium", "amount", "oldest"]
ROWS_ORDERS: tuple[RowsOrder, ...] = ("condominium", "oldest")
CONDOMINIUMS_ORDERS: tuple[CondominiumsOrder, ...] = ("code", "amount")
UNITS_ORDERS: tuple[UnitsOrder, ...] = ("condominium", "amount", "oldest")


@final
@dataclass(frozen=True)
class DelinquencyPage:
    """What the screen asks for: the page of rows (number, 1-based, and how many rows a page holds) and the order of the rows and of the condominium totals.

    Rows: `condominium` (by condominium code, then the oldest due date) or `oldest` (the longest overdue first, whatever the condominium).
    Condominium totals: `code` or `amount` (the largest debt first).
    Units (spec 072): their own page (`units_number`, with the same `size`) and order: `condominium` (code, then unit name), `amount` (the largest debt first) or `oldest`.
    """

    number: int = 1
    size: int = PAGE_SIZE
    rows_order: RowsOrder = "condominium"
    condominiums_order: CondominiumsOrder = "code"
    units_number: int = 1
    units_order: UnitsOrder = "condominium"


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
class DelinquencyUnitTotal:
    unit_id: UUID
    condominium_id: UUID
    condominium_name: str
    unit_name: str
    # The payer of the unit's oldest overdue boleto.
    payer_name: str
    count: int
    total_amount: Decimal
    oldest_due_date: date
    days_overdue: int


@final
@dataclass(frozen=True)
class DelinquencyReport:
    as_of: date
    count: int
    total_amount: Decimal
    by_condominium: list[DelinquencyCondominiumTotal]
    by_unit: list[DelinquencyUnitTotal]
    # How many units have an overdue boleto, which page of them `by_unit` is and how many pages they make; `units_truncated` when `by_unit` is the first `ROW_LIMIT` of the whole list (no page).
    unit_count: int
    units_page: int
    units_page_count: int
    units_truncated: bool
    rows: list[DelinquencyRow]
    # True when `rows` holds only the first `ROW_LIMIT`; the totals always cover every overdue document.
    truncated: bool
    # Which page `rows` is, how many rows a page holds and how many pages the overdue documents make (one page holds the whole list without `page`).
    page: int
    page_size: int
    page_count: int


def build_delinquency_report(
    documents: QuerySet[BillingDocument], as_of: date, page: DelinquencyPage | None = None, include_months: bool = True
) -> DelinquencyReport:
    """The boletos still awaiting payment whose due date is before `as_of`, with the days late and the totals.

    `documents` is already limited to what the user may see (company, filters). The amount is the boleto's
    face value: the gateway computes the fine and the interest only when it is paid. With `page` the rows are that
    page (`page.size` rows, 10 by default; the screen); without it they are the whole list up to `ROW_LIMIT` (the PDF).
    `by_unit` is one line per unit (spec 072), paged the same way; `include_months=False` leaves `rows` out (the summary).
    """
    overdue = documents.prefetch_related(None).overdue_on(as_of)  # type: ignore[attr-defined]
    rows_order = page.rows_order if page is not None else "condominium"
    row_sorting = (
        ("due_date", "unit__condominium__code", "unit__name", "id")
        if rows_order == "oldest"
        else ("unit__condominium__code", "due_date", "unit__name", "id")
    )
    ordered = overdue.select_related("unit__condominium", "unit__block", "payer").order_by(*row_sorting)
    if not include_months:
        fetched = shown = []
    elif page is None:
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
    condominiums_order = page.condominiums_order if page is not None else "code"
    condominium_sorting = ("-total", "unit__condominium__code") if condominiums_order == "amount" else ("unit__condominium__code",)
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
        .order_by(*condominium_sorting)
    ]
    count = sum(line.count for line in by_condominium)
    by_unit, unit_count = _unit_lines(overdue, as_of, page)
    return DelinquencyReport(
        as_of=as_of,
        count=count,
        total_amount=sum((line.total_amount for line in by_condominium), Decimal(0)),
        by_condominium=by_condominium,
        by_unit=by_unit,
        unit_count=unit_count,
        units_page=page.units_number if page is not None else 1,
        units_page_count=max(-(-unit_count // page.size), 1) if page is not None else 1,
        units_truncated=page is None and unit_count > ROW_LIMIT,
        rows=rows,
        truncated=page is None and len(fetched) > ROW_LIMIT,
        page=page.number if page is not None else 1,
        page_size=page.size if page is not None else ROW_LIMIT,
        page_count=max(-(-count // page.size), 1) if page is not None and include_months else 1,
    )


UNIT_SORTINGS: dict[str, tuple[str, ...]] = {
    "condominium": ("unit__condominium__code", "unit__name"),
    "amount": ("-total", "unit__condominium__code", "unit__name"),
    "oldest": ("oldest_due_date", "unit__condominium__code", "unit__name"),
}


def _unit_lines(overdue: QuerySet[BillingDocument], as_of: date, page: DelinquencyPage | None) -> tuple[list[DelinquencyUnitTotal], int]:
    """One line per unit that has an overdue boleto (its page, or the first `ROW_LIMIT` without a page) and how many units there are."""
    oldest_payer = Subquery(
        overdue.filter(unit=OuterRef("unit")).order_by("due_date", "id").values("payer__name")[:1]
    )
    grouped = (
        overdue.order_by()
        .values("unit", "unit__name", "unit__block__name", "unit__condominium", "unit__condominium__name")
        .annotate(count=Count("id"), total=Sum("amount"), oldest_due_date=Min("due_date"), payer_name=oldest_payer)
        .order_by(*UNIT_SORTINGS[page.units_order if page is not None else "condominium"])
    )
    unit_count = overdue.order_by().values("unit").distinct().count()
    if page is None:
        lines = list(grouped[:ROW_LIMIT])
    else:
        lines = list(grouped[(page.units_number - 1) * page.size : page.units_number * page.size])
    return (
        [
            DelinquencyUnitTotal(
                unit_id=line["unit"],
                condominium_id=line["unit__condominium"],
                condominium_name=line["unit__condominium__name"],
                unit_name=f'{line["unit__block__name"]} - {line["unit__name"]}' if line["unit__block__name"] else line["unit__name"],
                payer_name=line["payer_name"] or "",
                count=line["count"],
                total_amount=line["total"],
                oldest_due_date=line["oldest_due_date"],
                days_overdue=(as_of - line["oldest_due_date"]).days,
            )
            for line in lines
        ],
        unit_count,
    )
