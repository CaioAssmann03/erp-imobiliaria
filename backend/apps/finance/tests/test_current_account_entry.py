"""Ledger entry (roadmap phase 3 part 04, stage A, no spec yet): manual entry, consistency and immutability."""

import datetime
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.models import Company

from ..models import (
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
)

pytestmark = pytest.mark.django_db


def codes(entry: CurrentAccountEntry, field: str) -> list[str]:
    with pytest.raises(ValidationError) as error:
        entry.full_clean()
    return [item.code for item in error.value.error_dict[field]]


def test_a_valid_entry_is_saved(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry()

    entry.full_clean()
    entry.save()

    assert entry.registry is not None


def test_registry_grows_across_condominiums(  # type: ignore[no-untyped-def]
    make_entry,
    company: Company,
    other_condominium: Condominium,
    entry_batch: EntryBatch,
    staff_user: User,
) -> None:
    other_account = CurrentAccount.objects.create(
        company=company, condominium=other_condominium
    )
    other_center = CostCenter.objects.create(
        condominium=other_condominium, name="Normal"
    )
    other_template = EntryTemplate.objects.create(
        cost_center=other_center, name="PG DMAE"
    )
    first = make_entry()
    first.save()
    second = make_entry(
        current_account=other_account,
        cost_center=other_center,
        entry_template=other_template,
    )
    second.save()

    assert second.registry > first.registry


def test_amount_must_be_greater_than_zero(make_entry) -> None:  # type: ignore[no-untyped-def]
    assert codes(make_entry(amount=Decimal(0)), "amount") == ["amount.not_positive"]


def test_the_database_refuses_a_non_positive_amount(make_entry) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        make_entry(amount=Decimal(-1)).save()


def test_current_account_of_another_company_is_rejected(  # type: ignore[no-untyped-def]
    make_entry, other_company: Company
) -> None:
    entry = make_entry(company=other_company)

    assert "current_account_entry.current_account.other_company" in codes(
        entry, "current_account"
    )


def test_batch_of_another_company_is_rejected(
    make_entry, other_company: Company
) -> None:  # type: ignore[no-untyped-def]
    batch = EntryBatch.objects.create(
        company=other_company, batch_date=datetime.date(2026, 10, 6), origin="bank"
    )

    assert codes(make_entry(batch=batch), "batch") == [
        "current_account_entry.batch.other_company"
    ]


def test_cost_center_of_another_condominium_is_rejected(  # type: ignore[no-untyped-def]
    make_entry, other_condominium: Condominium
) -> None:
    other_center = CostCenter.objects.create(
        condominium=other_condominium, name="Normal"
    )

    assert codes(make_entry(cost_center=other_center), "cost_center") == [
        "current_account_entry.cost_center.other_condominium"
    ]


def test_inactive_cost_center_is_rejected(make_entry, cost_center: CostCenter) -> None:  # type: ignore[no-untyped-def]
    CostCenter.objects.filter(pk=cost_center.pk).update(active=False)
    cost_center.refresh_from_db()

    assert codes(make_entry(cost_center=cost_center), "cost_center") == [
        "current_account_entry.cost_center.inactive"
    ]


def test_entry_template_of_another_condominium_is_rejected(  # type: ignore[no-untyped-def]
    make_entry, other_condominium: Condominium
) -> None:
    other_center = CostCenter.objects.create(
        condominium=other_condominium, name="Normal"
    )
    other_template = EntryTemplate.objects.create(
        cost_center=other_center, name="PG DMAE"
    )

    assert codes(make_entry(entry_template=other_template), "entry_template") == [
        "current_account_entry.entry_template.other_condominium"
    ]


def test_inactive_entry_template_is_rejected(
    make_entry, entry_template: EntryTemplate
) -> None:  # type: ignore[no-untyped-def]
    EntryTemplate.objects.filter(pk=entry_template.pk).update(active=False)
    entry_template.refresh_from_db()

    assert codes(make_entry(entry_template=entry_template), "entry_template") == [
        "current_account_entry.entry_template.inactive"
    ]


def test_competence_month_must_be_the_first_day(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry(competence_month=datetime.date(2026, 10, 15))

    assert codes(entry, "competence_month") == [
        "current_account_entry.competence_month.not_first_day"
    ]


@pytest.mark.parametrize("justification", ["", "   "])
def test_justification_is_required(make_entry, justification: str) -> None:  # type: ignore[no-untyped-def]
    assert codes(make_entry(justification=justification), "justification")


def test_a_saved_entry_cannot_be_changed(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry()
    entry.save()
    entry.amount = Decimal("1.00")

    with pytest.raises(ValidationError) as error:
        entry.save()

    assert error.value.code == "current_account_entry.update_not_allowed"


def test_a_saved_entry_cannot_be_deleted(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry()
    entry.save()

    with pytest.raises(ValidationError) as error:
        entry.delete()

    assert error.value.code == "current_account_entry.deletion_not_allowed"
    assert CurrentAccountEntry.objects.filter(pk=entry.pk).exists()


def test_a_credit_adds_its_amount() -> None:
    entry = CurrentAccountEntry(
        kind=CurrentAccountEntry.Kind.CREDIT, amount=Decimal("40.00")
    )

    assert entry.signed_amount == Decimal("40.00")


def test_a_debit_subtracts_its_amount() -> None:
    entry = CurrentAccountEntry(
        kind=CurrentAccountEntry.Kind.DEBIT, amount=Decimal("100.00")
    )

    assert entry.signed_amount == Decimal("-100.00")


def current_registry_sequence_value() -> int:
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("SELECT last_value FROM current_account_entry_registry_seq")
        return int(cursor.fetchone()[0])


def test_validating_an_entry_does_not_draw_registry_numbers(make_entry) -> None:  # type: ignore[no-untyped-def]
    before = current_registry_sequence_value()

    for _ in range(3):
        make_entry().full_clean()

    assert current_registry_sequence_value() == before


def test_posted_entries_get_consecutive_registry_numbers(make_entry) -> None:  # type: ignore[no-untyped-def]
    from ..services.post_entry import post_entry

    first = post_entry(make_entry())
    second = post_entry(make_entry())

    assert second.registry == first.registry + 1
