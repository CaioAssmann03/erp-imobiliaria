"""The monthly issuance of a condominium (spec 026, R1, R4–R7)."""

from datetime import date
from decimal import Decimal

import pytest

from apps.condominiums.models import Condominium, Unit
from apps.billing.models import CondominiumBillingRules

from ..models import BillingDocument, BillingRun
from ..services.issue_condominium_billing import issue_condominium_billing

pytestmark = pytest.mark.django_db

OCTOBER = date(2026, 10, 1)
Kind = "ideal_fraction_share"
Problem = BillingRun.ProblemCode


def problems_of(run: BillingRun) -> set[tuple[str | None, str]]:
    """The run's problems, without the whole-condominium note that the condominium has no gateway account (the fixtures have none)."""
    return {
        (problem["unit"], problem["code"])
        for problem in run.problems
        if problem["code"] != Problem.GATEWAY_ACCOUNT_MISSING
    }


def test_every_billable_unit_gets_a_document_with_the_lines_in_order(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    unit = make_unit("101", gas_value=Decimal("20.00"))
    owner = link(unit, "Maria")
    _ = make_plan_item(position=1)
    _ = make_plan_item(position=2, description="Gás", calculation_kind="unit_registered_value", amount=None, unit_value_field="gas")

    run = issue_condominium_billing(condominium, OCTOBER)

    document = BillingDocument.objects.get()
    assert (run.status, run.issued_count) == (BillingRun.Status.SUCCEEDED, 1)
    assert document.unit == unit and document.payer == owner
    assert [(item.description, item.amount) for item in document.items.all()] == [
        ("Taxa condominial", Decimal("450.00")),
        ("Gás", Decimal("20.00")),
    ]
    assert document.amount == Decimal("470.00")


def test_the_dates_come_from_the_billing_rules(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    billing_rules.due_day = 10
    billing_rules.due_month = CondominiumBillingRules.DueMonth.FOLLOWING
    billing_rules.competence_month = CondominiumBillingRules.CompetenceMonth.BEFORE_DUE
    billing_rules.save()
    link(make_unit("101"), "Maria")
    _ = make_plan_item()

    _ = issue_condominium_billing(condominium, OCTOBER)

    document = BillingDocument.objects.get()
    assert document.due_date == date(2026, 11, 10)
    assert document.competence_month == OCTOBER


def test_running_twice_creates_no_duplicates(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    link(make_unit("101"), "Maria")
    _ = make_plan_item()
    _ = issue_condominium_billing(condominium, OCTOBER)

    second = issue_condominium_billing(condominium, OCTOBER)

    assert BillingDocument.objects.count() == 1
    assert (second.issued_count, second.already_issued_count, second.status) == (0, 1, BillingRun.Status.SUCCEEDED)
    assert BillingRun.objects.count() == 2


def test_a_unit_without_a_payer_is_skipped_and_the_others_are_issued(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    with_owner, without_owner = make_unit("101"), make_unit("102")
    link(with_owner, "Maria")
    _ = make_plan_item()

    run = issue_condominium_billing(condominium, OCTOBER)

    assert (run.issued_count, run.skipped_count, run.status) == (1, 1, BillingRun.Status.SUCCEEDED)
    assert problems_of(run) == {(str(without_owner.pk), Problem.NO_CURRENT_PAYER)}


def test_blocked_inactive_and_exempt_manager_units_are_not_billed(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    billing_rules.exempts_manager_unit = True
    billing_rules.save()
    blocked = make_unit("101", is_billing_blocked=True)
    manager = make_unit("102", is_manager_unit=True)
    inactive = make_unit("103", active=False)
    billed = make_unit("104")
    for unit in (blocked, manager, inactive, billed):
        link(unit, f"Dono {unit.name}")
    _ = make_plan_item()

    run = issue_condominium_billing(condominium, OCTOBER)

    assert list(BillingDocument.objects.values_list("unit__name", flat=True)) == ["104"]
    assert problems_of(run) == {(str(blocked.pk), Problem.UNIT_BILLING_BLOCKED), (str(manager.pk), Problem.MANAGER_UNIT_EXEMPT)}
    assert run.skipped_count == 2


def test_the_manager_unit_is_billed_when_not_exempt(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    link(make_unit("101", is_manager_unit=True), "Síndico")
    _ = make_plan_item()

    _ = issue_condominium_billing(condominium, OCTOBER)

    assert BillingDocument.objects.count() == 1


def test_a_unit_with_nothing_to_bill_gets_no_document(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    no_gas, with_gas = make_unit("101"), make_unit("102", gas_value=Decimal("10.00"))
    link(no_gas, "Maria")
    link(with_gas, "João")
    _ = make_plan_item(calculation_kind="unit_registered_value", amount=None, unit_value_field="gas")

    run = issue_condominium_billing(condominium, OCTOBER)

    assert list(BillingDocument.objects.values_list("unit__name", flat=True)) == ["102"]
    assert problems_of(run) == {(str(no_gas.pk), Problem.NOTHING_TO_BILL)}


def test_shares_split_the_total_among_the_active_units(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    first = make_unit("101", fraction=Decimal("0.4"))
    second = make_unit("102", fraction=Decimal("0.6"), is_billing_blocked=True)
    link(first, "Maria")
    link(second, "João")
    _ = make_plan_item(calculation_kind=Kind, amount=Decimal("1000.00"), criterion_position=1)

    _ = issue_condominium_billing(condominium, OCTOBER)

    assert BillingDocument.objects.get().amount == Decimal("400.00")


def test_fractions_that_do_not_close_fail_the_condominium(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    link(make_unit("101", fraction=Decimal("0.4")), "Maria")
    _ = make_plan_item(calculation_kind=Kind, amount=Decimal("1000.00"), criterion_position=1)

    run = issue_condominium_billing(condominium, OCTOBER)

    assert run.status == BillingRun.Status.FAILED
    assert problems_of(run) == {(None, Problem.INCONSISTENT_APPORTIONMENT)}
    assert not BillingDocument.objects.exists()


def test_no_plan_in_force_fails_the_run(condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link) -> None:  # type: ignore[no-untyped-def]
    link(make_unit("101"), "Maria")

    run = issue_condominium_billing(condominium, OCTOBER)

    assert run.status == BillingRun.Status.FAILED
    assert problems_of(run) == {(None, Problem.NO_PLAN_IN_FORCE)}


def test_a_condominium_without_billing_rules_fails_the_run(condominium: Condominium, make_unit, link, make_plan_item) -> None:  # type: ignore[no-untyped-def]
    link(make_unit("101"), "Maria")
    _ = make_plan_item()

    run = issue_condominium_billing(condominium, OCTOBER)

    assert run.status == BillingRun.Status.FAILED
    assert problems_of(run) == {(None, Problem.NO_BILLING_RULES)}


def test_a_document_that_cannot_be_issued_is_recorded_and_the_rest_continue(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, cost_center
) -> None:
    link(make_unit("101"), "Maria")
    _ = make_plan_item()
    type(cost_center).objects.filter(pk=cost_center.pk).update(active=False)

    run = issue_condominium_billing(condominium, OCTOBER)

    assert (run.status, run.failed_count, run.issued_count) == (BillingRun.Status.PARTIAL, 1, 0)
    assert {code for _unit, code in problems_of(run)} == {Problem.DOCUMENT_INVALID}


def test_the_run_is_recorded_with_its_times(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    link(make_unit("101"), "Maria")
    _ = make_plan_item()

    run = issue_condominium_billing(condominium, OCTOBER)

    run.refresh_from_db()
    assert run.finished_at is not None and run.finished_at >= run.started_at
    assert run.reference_month == OCTOBER


def test_other_units_data_is_untouched_by_a_unit_of_another_condominium(  # type: ignore[no-untyped-def]
    condominium: Condominium, other_condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item
) -> None:
    link(make_unit("101"), "Maria")
    _ = Unit.objects.create(condominium=other_condominium, name="201")
    _ = make_plan_item()

    _ = issue_condominium_billing(condominium, OCTOBER)

    assert BillingDocument.objects.filter(unit__condominium=other_condominium).count() == 0


def _activate_gateway(condominium: Condominium) -> None:
    from ..models import GatewayAccount

    _ = GatewayAccount.objects.create(
        company=condominium.company,
        api_key="k",
        webhook_token="t",
        status=GatewayAccount.Status.ACTIVE,
    )


def test_payer_without_document_and_missing_account_are_reported(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, monkeypatch: pytest.MonkeyPatch, django_capture_on_commit_callbacks
) -> None:
    from apps.persons.models import PeopleIndividual

    _ = make_plan_item()
    without_account = issue_condominium_billing(condominium, OCTOBER)
    assert any(p["code"] == Problem.GATEWAY_ACCOUNT_MISSING and p["unit"] is None for p in without_account.problems)

    BillingDocument.objects.all().delete()
    _activate_gateway(condominium)
    sent: list[tuple[str, list[str]]] = []
    monkeypatch.setattr(
        "apps.billing.services.issue_condominium_billing.celery_app.send_task",
        lambda name, args: sent.append((name, args)),
    )
    no_cpf_unit, cpf_unit = make_unit("101"), make_unit("102")
    _ = link(no_cpf_unit, "Sem Documento")
    with_cpf = link(cpf_unit, "Com Documento")
    _ = PeopleIndividual.objects.create(person=with_cpf, company=with_cpf.company, cpf="52998224725")

    with django_capture_on_commit_callbacks(execute=True):
        run = issue_condominium_billing(condominium, OCTOBER)

    assert problems_of(run) == {(str(no_cpf_unit.pk), Problem.PAYER_WITHOUT_DOCUMENT)}
    assert not any(p["code"] == Problem.GATEWAY_ACCOUNT_MISSING for p in run.problems)
    document = BillingDocument.objects.get(unit=cpf_unit)
    assert ("apps.billing.tasks.register_billing_document_task", [str(document.pk)]) in sent


# ----- spec 039: the launches join the plan in the same boleto -----


def test_a_launch_is_added_after_the_plan_in_its_own_cost_center(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, company
) -> None:
    from apps.finance.models import CostCenter, EntryTemplate

    from ..models import BillingEntry, BillingEntryUnit, BillingEvent

    first, second = make_unit("101"), make_unit("102")
    link(first, "Maria")
    link(second, "João")
    _ = make_plan_item()
    works_fund = CostCenter.objects.create(condominium=condominium, name="Fundo de Obras")
    _ = EntryTemplate.objects.create(cost_center=works_fund, name="REC Obras")
    event = BillingEvent.objects.create(company=company, code=3, name="Chamada extra")
    entry = BillingEntry(
        condominium=condominium,
        event=event,
        description="10/2026",
        allocation=BillingEntry.Allocation.COLLECTIVE,
        recurrence=BillingEntry.Recurrence.ONCE,
        start_month=OCTOBER,
        cost_center=works_fund,
        amount=Decimal("100.00"),
    )
    entry.full_clean()
    entry.save()
    for unit in (first, second):
        _ = BillingEntryUnit.objects.create(entry=entry, unit=unit)

    run = issue_condominium_billing(condominium, OCTOBER)

    documents = {document.unit.name: document for document in BillingDocument.objects.all()}
    assert run.status == BillingRun.Status.SUCCEEDED
    for document in documents.values():
        lines = list(document.items.all())
        assert [(line.description, line.amount, line.cost_center and line.cost_center.name) for line in lines] == [
            ("Taxa condominial", Decimal("450.00"), "Taxa Ordinária"),
            ("0003-Chamada extra - 10/2026", Decimal("50.00"), "Fundo de Obras"),
        ]
        assert lines[1].billing_entry == entry
        assert document.amount == Decimal("500.00")


def test_a_launch_only_reaches_the_units_it_selects_and_a_month_with_only_launches_is_issued(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, cost_center, entry_template
) -> None:
    from ..models import BillingEntry, BillingEntryUnit

    chosen, other = make_unit("101"), make_unit("102")
    link(chosen, "Maria")
    link(other, "João")
    entry = BillingEntry(
        condominium=condominium,
        allocation=BillingEntry.Allocation.INDIVIDUAL,
        recurrence=BillingEntry.Recurrence.ALWAYS,
        start_month=OCTOBER,
        cost_center=cost_center,
        description="Taxa de gás",
        amount=Decimal("30.00"),
    )
    entry.full_clean()
    entry.save()
    _ = BillingEntryUnit.objects.create(entry=entry, unit=chosen)

    run = issue_condominium_billing(condominium, OCTOBER)

    assert BillingDocument.objects.get().unit == chosen
    assert (run.issued_count, run.skipped_count) == (1, 1)
    assert Problem.NO_PLAN_IN_FORCE not in {problem["code"] for problem in run.problems}


def test_an_installment_that_is_over_is_not_billed_again(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, cost_center, entry_template
) -> None:
    from ..models import BillingEntry, BillingEntryUnit

    unit = make_unit("101")
    link(unit, "Maria")
    _ = make_plan_item()
    entry = BillingEntry(
        condominium=condominium,
        allocation=BillingEntry.Allocation.INDIVIDUAL,
        recurrence=BillingEntry.Recurrence.INSTALLMENTS,
        installments_total=2,
        start_month=date(2026, 8, 1),
        cost_center=cost_center,
        description="Reforma",
        amount=Decimal("10.00"),
    )
    entry.full_clean()
    entry.save()
    _ = BillingEntryUnit.objects.create(entry=entry, unit=unit)

    _ = issue_condominium_billing(condominium, OCTOBER)

    assert [line.description for line in BillingDocument.objects.get().items.all()] == ["Taxa condominial"]
