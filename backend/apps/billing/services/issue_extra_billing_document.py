import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.billing.models import BillingDocument, BillingEntry, BillingRun, GatewayAccount
from apps.billing.services.create_billing_document import (
    NewBillingDocument,
    NewBillingDocumentItem,
    create_billing_document,
)
from apps.billing.services.schedule_billing_document_tasks import schedule_billing_document_tasks
from apps.condominiums.models import Condominium, Unit
from apps.persons.models import Person

ProblemCode = BillingRun.ProblemCode


@dataclass(frozen=True)
class SkippedUnit:
    unit: Unit
    code: BillingRun.ProblemCode


@dataclass
class ExtraIssuance:
    issued: list[BillingDocument] = field(default_factory=list)
    skipped: list[SkippedUnit] = field(default_factory=list)


def issue_extra_billing_document(
    condominium: Condominium,
    units: Sequence[Unit],
    lines: Sequence[BillingEntry],
    due_date: date,
    competence_month: date,
) -> ExtraIssuance:
    """Issue a standalone boleto (spec 054) to each of `units`, outside the monthly issuance.

    `lines` are unsaved, already validated launches (the same shares as the *Inclusão de valores* screen). Each unit is
    issued in its own transaction, so a unit that cannot be issued is only reported and the others still are.
    The condominium must have billing rules: the caller checks that.
    """
    gateway_account = GatewayAccount.objects.filter(company_id=condominium.company_id).first()
    registers_at_gateway = gateway_account is not None and gateway_account.can_register_charges()
    today = timezone.localdate()
    issuance = ExtraIssuance()
    payers: dict[uuid.UUID, Person] = {}
    for unit in units:
        payer, skip_code = _payer_of(unit, registers_at_gateway, today)
        if payer is None:
            issuance.skipped.append(SkippedUnit(unit, skip_code))
        else:
            payers[unit.pk] = payer
    # A share is split among the units that can be issued: what a skipped unit would have paid is not left out.
    billable = [unit for unit in units if unit.pk in payers]
    amounts_by_line = [line.amounts_by_unit(billable) for line in lines]
    for unit in billable:
        items = tuple(
            NewBillingDocumentItem(line.line_description(competence_month), line.cost_center, line.entry_template, amounts[unit.pk])
            for line, amounts in zip(lines, amounts_by_line, strict=True)
            if amounts[unit.pk] > Decimal(0)
        )
        if not items:
            issuance.skipped.append(SkippedUnit(unit, ProblemCode.NOTHING_TO_BILL))
            continue
        new_document = NewBillingDocument(
            unit=unit,
            payer=payers[unit.pk],
            reference_month=competence_month,
            competence_month=competence_month,
            due_date=due_date,
            items=items,
            kind=BillingDocument.Kind.EXTRA,
        )
        try:
            with transaction.atomic():
                document = create_billing_document(new_document)
        except ValidationError:
            issuance.skipped.append(SkippedUnit(unit, ProblemCode.DOCUMENT_INVALID))
            continue
        issuance.issued.append(document)
        schedule_billing_document_tasks(document, registers_at_gateway)
    return issuance


def _payer_of(unit: Unit, registers_at_gateway: bool, today: date) -> tuple[Person | None, BillingRun.ProblemCode]:
    """The unit's current payer, or (None, why the unit cannot be issued)."""
    if not unit.active or unit.is_billing_blocked:
        return None, ProblemCode.UNIT_BILLING_BLOCKED
    payer = unit.billing_payer(today)
    if payer is None:
        return None, ProblemCode.NO_CURRENT_PAYER
    if registers_at_gateway and payer.tax_id is None:
        return None, ProblemCode.PAYER_WITHOUT_DOCUMENT
    return payer, ProblemCode.NOTHING_TO_BILL
