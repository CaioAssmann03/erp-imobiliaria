from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final
from uuid import UUID

from django.db.models import Sum

from apps.billing.models import BillingDocument
from apps.condominiums.models import Unit, UnitPerson
from apps.core.infrastructure.dates import add_months
from apps.finance.models import CurrentAccountEntry

ROW_LIMIT = 2000


@final
@dataclass(frozen=True)
class UnitSheetFraction:
    criterion_name: str
    value: Decimal


@final
@dataclass(frozen=True)
class UnitSheetPerson:
    role: str
    name: str
    ownership_percentage: Decimal | None
    start_date: date
    end_date: date | None


@final
@dataclass(frozen=True)
class UnitSheetBoleto:
    id: UUID
    reference_month: date
    kind: str
    due_date: date
    amount: Decimal
    status: str
    is_overdue: bool
    days_overdue: int
    paid_on: date | None


@final
@dataclass(frozen=True)
class UnitSheetEntry:
    id: UUID
    entry_date: date
    kind: str
    amount: Decimal
    description: str
    cost_center_name: str


@final
@dataclass(frozen=True)
class UnitSheet:
    unit_id: UUID
    unit_name: str
    block_name: str | None
    condominium_id: UUID
    condominium_code: int
    condominium_name: str
    unit_type: str
    is_active: bool
    is_manager_unit: bool
    is_billing_blocked: bool
    registration_number: str
    resident_count: int
    gas_value: Decimal
    water_value: Decimal
    electricity_value: Decimal
    from_month: date
    to_month: date
    fractions: list[UnitSheetFraction]
    people: list[UnitSheetPerson]
    boletos: list[UnitSheetBoleto]
    # Issued = every boleto of the period that is not cancelled = paid + open; overdue is the part of open past its due date.
    total_issued: Decimal
    total_paid: Decimal
    total_open: Decimal
    total_overdue: Decimal
    boletos_truncated: bool
    entries: list[UnitSheetEntry]
    total_credits: Decimal
    total_debits: Decimal
    entries_truncated: bool


def build_unit_sheet(unit: Unit, from_month: date, to_month: date, reference_date: date) -> UnitSheet:
    """One page about a unit: its data and people as of `reference_date`, its boletos and its entries in the period.

    The boletos are those whose reference month is in `from_month`…`to_month` (inclusive, first days of months) and the
    entries those whose `entry_date` is in the same months. The totals cover the whole period even when a list is cut.
    """
    period_end = add_months(to_month, 1)
    documents = (
        BillingDocument.objects.filter(unit=unit, reference_month__gte=from_month, reference_month__lt=period_end)
        .select_related("payment")
        .order_by("-reference_month", "due_date", "created_at")
    )
    fetched_documents = list(documents[: ROW_LIMIT + 1])
    boletos = [_boleto(document, reference_date) for document in fetched_documents[:ROW_LIMIT]]
    # The totals are over every document of the period, not only the listed ones.
    all_documents = list(documents.exclude(status=BillingDocument.Status.CANCELLED).values("status", "due_date", "amount"))
    total_issued = sum((item["amount"] for item in all_documents), Decimal(0))
    total_paid = sum((item["amount"] for item in all_documents if item["status"] == BillingDocument.Status.PAID), Decimal(0))
    open_documents = [item for item in all_documents if item["status"] in BillingDocument.AWAITING_PAYMENT_STATUSES]
    total_open = sum((item["amount"] for item in open_documents), Decimal(0))
    total_overdue = sum((item["amount"] for item in open_documents if item["due_date"] < reference_date), Decimal(0))

    entries = CurrentAccountEntry.objects.filter(unit=unit, entry_date__gte=from_month, entry_date__lt=period_end)
    totals = {
        kind: entries.filter(kind=kind).aggregate(total=Sum("amount"))["total"] or Decimal(0)
        for kind in (CurrentAccountEntry.Kind.CREDIT, CurrentAccountEntry.Kind.DEBIT)
    }
    fetched_entries = list(entries.select_related("cost_center").order_by("entry_date", "registry")[: ROW_LIMIT + 1])

    condominium = unit.condominium
    return UnitSheet(
        unit_id=unit.pk,
        unit_name=unit.name,
        block_name=unit.block.name if unit.block else None,
        condominium_id=condominium.pk,
        condominium_code=condominium.code,
        condominium_name=condominium.name,
        unit_type=unit.type,
        is_active=unit.active,
        is_manager_unit=unit.is_manager_unit,
        is_billing_blocked=unit.is_billing_blocked,
        registration_number=unit.registration_number,
        resident_count=unit.resident_count,
        gas_value=unit.gas_value,
        water_value=unit.water_value,
        electricity_value=unit.electricity_value,
        from_month=from_month,
        to_month=to_month,
        fractions=[
            UnitSheetFraction(fraction.criterion.name, fraction.value)
            for fraction in unit.fractions.select_related("criterion").order_by("criterion__position")
        ],
        people=[
            UnitSheetPerson(link.role, link.person.name, link.ownership_percentage, link.start_date, link.end_date)
            for link in UnitPerson.objects.current(reference_date)
            .filter(unit=unit, start_date__lte=reference_date)
            .select_related("person")
            .order_by("role", "-ownership_percentage", "start_date")
        ],
        boletos=boletos,
        total_issued=total_issued,
        total_paid=total_paid,
        total_open=total_open,
        total_overdue=total_overdue,
        boletos_truncated=len(fetched_documents) > ROW_LIMIT,
        entries=[
            UnitSheetEntry(entry.pk, entry.entry_date, entry.kind, entry.amount, entry.description, entry.cost_center.name)
            for entry in fetched_entries[:ROW_LIMIT]
        ],
        total_credits=totals[CurrentAccountEntry.Kind.CREDIT],
        total_debits=totals[CurrentAccountEntry.Kind.DEBIT],
        entries_truncated=len(fetched_entries) > ROW_LIMIT,
    )


def _boleto(document: BillingDocument, reference_date: date) -> UnitSheetBoleto:
    is_overdue = document.is_overdue_on(reference_date)
    payment = getattr(document, "payment", None)
    return UnitSheetBoleto(
        id=document.pk,
        reference_month=document.reference_month,
        kind=document.kind,
        due_date=document.due_date,
        amount=document.amount,
        status=document.status,
        is_overdue=is_overdue,
        days_overdue=(reference_date - document.due_date).days if is_overdue else 0,
        paid_on=payment.paid_on if payment else None,
    )
