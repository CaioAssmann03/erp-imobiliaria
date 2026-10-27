import uuid
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from django.utils import timezone

from apps.billing.models import (
    BillingDocument,
    BillingEntry,
    BillingEntryUnit,
    BillingPlan,
    BillingPlanItem,
    BillingRun,
    GatewayAccount,
)
from apps.billing.services.create_billing_document import (
    NewBillingDocument,
    NewBillingDocumentItem,
    create_billing_document,
)
from apps.condominiums.models import BillingRules, Condominium, Unit
from config.celery import app as celery_app

ProblemCode = BillingRun.ProblemCode


def issue_condominium_billing(condominium: Condominium, reference_month: date) -> BillingRun:
    """Issue the month's document of every billable unit of the condominium and record the run.

    Each unit is issued in its own transaction, so one unit's problem does not stop the others; a unit that
    already has a document for the month is only counted, which makes a rerun harmless.
    """
    run = BillingRun(condominium=condominium, reference_month=reference_month)
    run.full_clean()
    run.save()
    try:
        _issue_units(run)
    except Exception:
        _finish(run, BillingRun.Status.FAILED)
        raise
    return run


def _issue_units(run: BillingRun) -> None:
    condominium, reference_month = run.condominium, run.reference_month
    billing_rules = BillingRules.objects.filter(condominium=condominium).first()
    if billing_rules is None:
        return _fail_condominium(run, ProblemCode.NO_BILLING_RULES)
    items = _items_in_force(condominium, reference_month)
    entries = _entries_in_force(condominium, reference_month)
    if not items and not entries:
        return _fail_condominium(run, ProblemCode.NO_PLAN_IN_FORCE)
    units = list(
        condominium.units.filter(active=True).select_related("block").prefetch_related("unit_people__person")
    )
    apportionment_totals = Unit.objects.filter(condominium=condominium).apportionment_totals()
    if any(item.uses_inconsistent_apportionment(apportionment_totals) for item in items):
        return _fail_condominium(run, ProblemCode.INCONSISTENT_APPORTIONMENT)

    gateway_account = GatewayAccount.objects.filter(company_id=condominium.company_id).first()
    registers_at_gateway = gateway_account is not None and gateway_account.can_register_charges()
    if not registers_at_gateway:
        # The documents are still issued, as drafts: they are registered once the account is active.
        _record_problem(run, None, ProblemCode.GATEWAY_ACCOUNT_MISSING)

    amounts_by_item = [item.amounts_by_unit(units) for item in items]
    amounts_by_entry = [_entry_amounts(entry, units) for entry in entries]
    already_issued_unit_ids = set(
        BillingDocument.objects.filter(unit__condominium=condominium, reference_month=reference_month)
        .exclude(status=BillingDocument.Status.CANCELLED)
        .values_list("unit_id", flat=True)
    )
    today = timezone.localdate()
    due_date = billing_rules.due_date_of(reference_month)
    competence_month = billing_rules.competence_month_of(reference_month)
    for unit in units:
        if unit.pk in already_issued_unit_ids:
            run.already_issued_count += 1
            continue
        lines = [
            NewBillingDocumentItem(item.line_description(), item.cost_center, item.entry_template, amounts[unit.pk])
            for item, amounts in zip(items, amounts_by_item, strict=True)
            if amounts[unit.pk] > Decimal(0)
        ]
        lines += [
            NewBillingDocumentItem(
                entry.line_description(reference_month), entry.cost_center, entry.entry_template, amounts[unit.pk], entry
            )
            for entry, amounts in zip(entries, amounts_by_entry, strict=True)
            if amounts.get(unit.pk, Decimal(0)) > Decimal(0) and (entry.entry_template is not None or entry.credits_company)
        ]
        skip_code = _skip_code(unit, billing_rules, has_lines=bool(lines))
        payer = unit.billing_payer(today) if skip_code is None else None
        if skip_code is None and payer is None:
            skip_code = ProblemCode.NO_CURRENT_PAYER
        if skip_code is None and registers_at_gateway and payer is not None and payer.tax_id is None:
            skip_code = ProblemCode.PAYER_WITHOUT_DOCUMENT
        if skip_code is not None or payer is None:
            _record_problem(run, unit.pk, skip_code or ProblemCode.NO_CURRENT_PAYER)
            run.skipped_count += 1
            continue
        _issue_unit(
            run,
            NewBillingDocument(
                unit=unit,
                payer=payer,
                reference_month=reference_month,
                competence_month=competence_month,
                due_date=due_date,
                items=tuple(lines),
            ),
            registers_at_gateway,
        )
    failed = run.failed_count > 0
    _finish(run, BillingRun.Status.PARTIAL if failed else BillingRun.Status.SUCCEEDED)


def _items_in_force(condominium: Condominium, reference_month: date) -> list[BillingPlanItem]:
    plans = BillingPlan.objects.in_force(reference_month).filter(condominium=condominium).prefetch_related(
        Prefetch(
            "items",
            queryset=BillingPlanItem.objects.select_related("event", "cost_center", "entry_template").order_by("position"),
        )
    )
    return [item for plan in plans for item in plan.items.all()]


def _entries_in_force(condominium: Condominium, reference_month: date) -> list[BillingEntry]:
    """The launches the month's boleto carries (spec 039), in the order they were written."""
    return list(
        BillingEntry.objects.in_force(reference_month)
        .filter(condominium=condominium)
        .select_related("event", "cost_center", "entry_template")
        .prefetch_related(Prefetch("entry_units", queryset=BillingEntryUnit.objects.select_related("unit")))
        .order_by("created_at")
    )


def _entry_amounts(entry: BillingEntry, billable_units: list[Unit]) -> dict[uuid.UUID, Decimal]:
    """What each active unit the entry selects pays; a split is shared only among those units."""
    active_ids = {unit.pk for unit in billable_units}
    links = [link for link in entry.entry_units.all() if link.unit_id in active_ids]
    overrides = {link.unit_id: link.amount for link in links if link.amount is not None}
    return entry.amounts_by_unit([link.unit for link in links], overrides)


def _skip_code(unit: Unit, billing_rules: BillingRules, has_lines: bool) -> BillingRun.ProblemCode | None:
    if unit.is_billing_blocked:
        return ProblemCode.UNIT_BILLING_BLOCKED
    if billing_rules.exempts(unit):
        return ProblemCode.MANAGER_UNIT_EXEMPT
    if not has_lines:
        return ProblemCode.NOTHING_TO_BILL
    return None


def _issue_unit(run: BillingRun, new_document: NewBillingDocument, registers_at_gateway: bool) -> None:
    try:
        with transaction.atomic():
            document = create_billing_document(new_document)
    except ValidationError:
        _record_problem(run, new_document.unit.pk, ProblemCode.DOCUMENT_INVALID)
        run.failed_count += 1
    except IntegrityError:
        # A simultaneous run issued the unit first: the unique constraint is the last line of defence.
        run.already_issued_count += 1
    else:
        run.issued_count += 1
        document_id = str(document.pk)
        # By name: tasks.py imports this module. The PDF is generated once the unit's transaction has committed.
        transaction.on_commit(
            lambda: celery_app.send_task("apps.billing.tasks.generate_billing_document_pdf_task", args=[document_id])
        )
        if registers_at_gateway:
            transaction.on_commit(
                lambda: celery_app.send_task("apps.billing.tasks.register_billing_document_task", args=[document_id])
            )


def _record_problem(run: BillingRun, unit_id: uuid.UUID | None, code: BillingRun.ProblemCode) -> None:
    run.problems = [*run.problems, {"unit": str(unit_id) if unit_id else None, "code": code.value}]


def _fail_condominium(run: BillingRun, code: BillingRun.ProblemCode) -> None:
    _record_problem(run, None, code)
    _finish(run, BillingRun.Status.FAILED)


def _finish(run: BillingRun, status: BillingRun.Status) -> None:
    run.status = status
    run.finished_at = timezone.now()
    run.full_clean()
    run.save()
