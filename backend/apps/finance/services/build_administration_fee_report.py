from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final
from uuid import UUID

from django.db.models import Case, DecimalField, F, QuerySet, Sum, Value, When

from apps.condominiums.models import Condominium, CondominiumAdministrationContract
from apps.core.infrastructure.dates import add_months
from apps.finance.models import CurrentAccountEntry

MONEY = DecimalField(max_digits=14, decimal_places=2)
Contract = CondominiumAdministrationContract


@final
@dataclass(frozen=True)
class AdministrationFeeRow:
    condominium_id: UUID
    condominium_code: int
    condominium_name: str
    # `due` (counted), `not_started` (the contract starts later) or `no_contract` (neither is counted).
    status: str
    fee_type: str | None
    fee_basis: str | None
    fee_percentage: Decimal | None
    fee_amount: Decimal | None
    fee_floor: Decimal | None
    fee_ceiling: Decimal | None
    # The month's revenue or expense of the account; only for a variable fee.
    base_amount: Decimal | None
    fee_before_limits: Decimal
    fee_due: Decimal
    charges_iss_on_fee: bool


@final
@dataclass(frozen=True)
class AdministrationFeeReport:
    month: date
    count: int
    total_fee: Decimal
    rows: list[AdministrationFeeRow]


def _sum_of_kind(kind: str) -> Sum:
    return Sum(Case(When(kind=kind, then=F("amount")), default=Value(Decimal(0), output_field=MONEY), output_field=MONEY))


def build_administration_fee_report(
    month: date, condominiums: QuerySet[Condominium], entries: QuerySet[CurrentAccountEntry]
) -> AdministrationFeeReport:
    """What the administradora has to charge each of `condominiums` in `month` (the first day), from its contract.

    A variable fee's base is the month's statement: the credits (basis revenue) or the debits (basis expense) of the
    condominium's account by `entry_date`. The arithmetic is the contract's (`fee_for`); this only gathers and totals.
    """
    movement = {
        line["current_account__condominium"]: line
        for line in entries.filter(entry_date__gte=month, entry_date__lt=add_months(month, 1))
        .order_by()
        .values("current_account__condominium")
        .annotate(credits=_sum_of_kind(CurrentAccountEntry.Kind.CREDIT), debits=_sum_of_kind(CurrentAccountEntry.Kind.DEBIT))
    }
    rows: list[AdministrationFeeRow] = []
    for condominium in condominiums.select_related("administration_contract").order_by("code"):
        contract: Contract | None = getattr(condominium, "administration_contract", None)
        if contract is None:
            rows.append(_row(condominium, "no_contract", None, None))
            continue
        if not contract.is_due_in(month):
            rows.append(_row(condominium, "not_started", contract, None))
            continue
        base = None
        if contract.fee_type == Contract.FeeType.VARIABLE:
            line = movement.get(condominium.pk)
            is_revenue = contract.fee_basis == Contract.FeeBasis.REVENUE
            base = (line["credits"] if is_revenue else line["debits"]) if line else Decimal(0)
        rows.append(_row(condominium, "due", contract, base))
    due = [row for row in rows if row.status == "due"]
    return AdministrationFeeReport(
        month=month, count=len(due), total_fee=sum((row.fee_due for row in due), Decimal(0)), rows=rows
    )


def _row(condominium: Condominium, status: str, contract: Contract | None, base: Decimal | None) -> AdministrationFeeRow:
    due = status == "due" and contract is not None
    return AdministrationFeeRow(
        condominium_id=condominium.pk,
        condominium_code=condominium.code,
        condominium_name=condominium.name,
        status=status,
        fee_type=contract.fee_type if contract else None,
        fee_basis=contract.fee_basis if contract else None,
        fee_percentage=contract.fee_percentage if contract else None,
        fee_amount=contract.fee_amount if contract else None,
        fee_floor=contract.fee_floor if contract else None,
        fee_ceiling=contract.fee_ceiling if contract else None,
        base_amount=base,
        fee_before_limits=contract.fee_before_limits(base or Decimal(0)) if contract and due else Decimal(0),
        fee_due=contract.fee_for(base or Decimal(0)) if contract and due else Decimal(0),
        charges_iss_on_fee=contract.charges_iss_on_fee if contract else False,
    )
