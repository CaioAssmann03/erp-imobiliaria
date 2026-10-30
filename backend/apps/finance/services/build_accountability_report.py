from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final
from uuid import UUID

from django.db.models import Case, DecimalField, F, QuerySet, Sum, Value, When

from apps.condominiums.models import Condominium
from apps.core.infrastructure.dates import add_months
from apps.finance.models import CostCenter, CurrentAccountEntry

ROW_LIMIT = 2000
PAGE_SIZE = 10
MAX_PAGE_SIZE = 100
MONEY = DecimalField(max_digits=14, decimal_places=2)


@final
@dataclass(frozen=True)
class AccountabilityPages:
    """The page of each list the screen shows (1-based) and how many lines a page holds; the lists are paged apart because only one is on screen."""

    cost_centers: int
    entries: int
    size: int = PAGE_SIZE


@final
@dataclass(frozen=True)
class AccountabilityEntryRow:
    id: UUID
    entry_date: date
    kind: str
    amount: Decimal
    description: str
    cost_center_name: str
    entry_template_name: str
    unit_name: str | None


@final
@dataclass(frozen=True)
class AccountabilityCostCenterTotals:
    cost_center_id: UUID
    cost_center_code: int
    cost_center_name: str
    opening_balance: Decimal
    total_credits: Decimal
    total_debits: Decimal
    closing_balance: Decimal


@final
@dataclass(frozen=True)
class AccountabilityReport:
    condominium_id: UUID
    condominium_code: int
    condominium_name: str
    month: date
    opening_balance: Decimal
    total_credits: Decimal
    total_debits: Decimal
    closing_balance: Decimal
    by_cost_center: list[AccountabilityCostCenterTotals]
    entries: list[AccountabilityEntryRow]
    # True when `entries` holds only the first `ROW_LIMIT`; every total always covers the whole month.
    truncated: bool
    # How many sub-contas and entries the month has, which page of each `by_cost_center` and `entries` are, and how many pages they make
    # (one page holds the whole list without `pages`).
    page_size: int
    cost_center_count: int
    cost_center_page: int
    cost_center_page_count: int
    entry_count: int
    entry_page: int
    entry_page_count: int


def _signed_amount() -> Case:
    """The entry's amount with its sign: a credit adds to the balance, a debit takes from it."""
    return Case(
        When(kind=CurrentAccountEntry.Kind.CREDIT, then=F("amount")),
        default=-F("amount"),
        output_field=MONEY,
    )


def _sum_of_kind(kind: str) -> Sum:
    """The sum of the amounts of one kind (credit or debit); zero when there is none."""
    return Sum(Case(When(kind=kind, then=F("amount")), default=Value(Decimal(0), output_field=MONEY), output_field=MONEY))


def _page_count(count: int, size: int) -> int:
    return max(-(-count // size), 1)


def build_accountability_report(
    condominium: Condominium, month: date, entries: QuerySet[CurrentAccountEntry], pages: AccountabilityPages | None = None
) -> AccountabilityReport:
    """A condominium's month in its current account: opening balance, credits, debits and closing balance.

    `month` is the first day of the month and `entries` the entries of that condominium's account. The
    movement is by `entry_date` (the day the money moved), so `opening + credits - debits = closing`
    holds in total and for each sub-conta, and the closing balance of a month is the opening of the next.
    With `pages` the sub-contas and the entries are those pages of `pages.size` lines, 10 by default (the screen) while the totals still
    cover everything; without it they are the whole lists, the entries up to `ROW_LIMIT` (the PDF).
    """
    next_month = add_months(month, 1)
    before = entries.filter(entry_date__lt=month)
    in_month = entries.filter(entry_date__gte=month, entry_date__lt=next_month)

    opening_by_center = {
        line["cost_center"]: line["balance"] or Decimal(0)
        for line in before.order_by().values("cost_center").annotate(balance=Sum(_signed_amount()))
    }
    movement_by_center = {
        line["cost_center"]: line
        for line in in_month.order_by()
        .values("cost_center")
        .annotate(
            credits=_sum_of_kind(CurrentAccountEntry.Kind.CREDIT),
            debits=_sum_of_kind(CurrentAccountEntry.Kind.DEBIT),
        )
    }
    center_ids = set(opening_by_center) | set(movement_by_center)
    centers = {center.pk: center for center in CostCenter.objects.filter(pk__in=center_ids)}
    by_cost_center = []
    for center_id in center_ids:
        opening = opening_by_center.get(center_id, Decimal(0))
        movement = movement_by_center.get(center_id)
        credits = movement["credits"] if movement else Decimal(0)
        debits = movement["debits"] if movement else Decimal(0)
        center = centers[center_id]
        by_cost_center.append(
            AccountabilityCostCenterTotals(
                cost_center_id=center.pk,
                cost_center_code=center.code,
                cost_center_name=center.name,
                opening_balance=opening,
                total_credits=credits,
                total_debits=debits,
                closing_balance=opening + credits - debits,
            )
        )
    by_cost_center.sort(key=lambda line: line.cost_center_code)
    opening_total = sum((line.opening_balance for line in by_cost_center), Decimal(0))
    credits_total = sum((line.total_credits for line in by_cost_center), Decimal(0))
    debits_total = sum((line.total_debits for line in by_cost_center), Decimal(0))
    cost_center_count = len(by_cost_center)
    entry_count = in_month.count()

    ordered = in_month.select_related("cost_center", "entry_template", "unit__block").order_by("entry_date", "registry")
    if pages is None:
        fetched = list(ordered[: ROW_LIMIT + 1])
        shown = fetched[:ROW_LIMIT]
    else:
        shown_centers = by_cost_center[(pages.cost_centers - 1) * pages.size : pages.cost_centers * pages.size]
        by_cost_center = shown_centers
        fetched = shown = list(ordered[(pages.entries - 1) * pages.size : pages.entries * pages.size])
    rows = [
        AccountabilityEntryRow(
            id=entry.pk,
            entry_date=entry.entry_date,
            kind=entry.kind,
            amount=entry.amount,
            description=entry.description,
            cost_center_name=entry.cost_center.name,
            entry_template_name=entry.entry_template.name,
            unit_name=entry.unit.display_name if entry.unit else None,
        )
        for entry in shown
    ]
    return AccountabilityReport(
        condominium_id=condominium.pk,
        condominium_code=condominium.code,
        condominium_name=condominium.name,
        month=month,
        opening_balance=opening_total,
        total_credits=credits_total,
        total_debits=debits_total,
        closing_balance=opening_total + credits_total - debits_total,
        by_cost_center=by_cost_center,
        entries=rows,
        truncated=pages is None and len(fetched) > ROW_LIMIT,
        page_size=pages.size if pages is not None else ROW_LIMIT,
        cost_center_count=cost_center_count,
        cost_center_page=pages.cost_centers if pages else 1,
        cost_center_page_count=_page_count(cost_center_count, pages.size) if pages else 1,
        entry_count=entry_count,
        entry_page=pages.entries if pages else 1,
        entry_page_count=_page_count(entry_count, pages.size) if pages else 1,
    )
