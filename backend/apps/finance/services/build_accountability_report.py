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
MONEY = DecimalField(max_digits=14, decimal_places=2)


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


def build_accountability_report(
    condominium: Condominium, month: date, entries: QuerySet[CurrentAccountEntry]
) -> AccountabilityReport:
    """A condominium's month in its current account: opening balance, credits, debits and closing balance.

    `month` is the first day of the month and `entries` the entries of that condominium's account. The
    movement is by `entry_date` (the day the money moved), so `opening + credits - debits = closing`
    holds in total and for each sub-conta, and the closing balance of a month is the opening of the next.
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

    ordered = in_month.select_related("cost_center", "entry_template", "unit__block").order_by("entry_date", "registry")
    fetched = list(ordered[: ROW_LIMIT + 1])
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
        for entry in fetched[:ROW_LIMIT]
    ]
    opening_total = sum((line.opening_balance for line in by_cost_center), Decimal(0))
    credits_total = sum((line.total_credits for line in by_cost_center), Decimal(0))
    debits_total = sum((line.total_debits for line in by_cost_center), Decimal(0))
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
        truncated=len(fetched) > ROW_LIMIT,
    )
