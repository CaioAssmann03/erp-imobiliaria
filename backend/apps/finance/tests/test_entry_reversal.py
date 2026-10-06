"""Reversing a ledger entry (roadmap phase 3 part 04, spec 014): the opposite entry, never a change or a delete."""

import datetime
from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.accounts.models import User

from ..models import CurrentAccount, CurrentAccountEntry
from ..services.post_entry import post_entry
from ..services.reverse_entry import reverse_entry

pytestmark = pytest.mark.django_db

REVERSAL_DATE = datetime.date(2026, 10, 7)


def reverse(entry: CurrentAccountEntry, user: User, reason: str = "Posted by mistake") -> CurrentAccountEntry:
    return reverse_entry(entry, reason, REVERSAL_DATE, user)


def test_reversing_a_debit_posts_a_credit_of_the_same_amount(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry(kind="debit", amount=Decimal("100.00")))

    reversal = reverse(original, staff_user)

    assert reversal.kind == CurrentAccountEntry.Kind.CREDIT
    assert reversal.amount == Decimal("100.00")
    assert reversal.reversal_of == original
    assert reversal.entry_date == REVERSAL_DATE


def test_reversing_a_credit_posts_a_debit(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry(kind="credit", amount=Decimal("40.00")))

    assert reverse(original, staff_user).kind == CurrentAccountEntry.Kind.DEBIT


def test_the_reversal_brings_the_balance_back(make_entry: Any, staff_user: User, current_account: CurrentAccount) -> None:
    original = post_entry(make_entry(kind="debit", amount=Decimal("100.00")))
    current_account.refresh_from_db()
    assert current_account.balance == Decimal("-100.00")

    reverse(original, staff_user)

    current_account.refresh_from_db()
    assert current_account.balance == Decimal("0.00")
    assert current_account.balance == current_account.recalculated_balance()


def test_the_reversal_keeps_the_context_of_the_original(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry())

    reversal = reverse(original, staff_user, reason="Wrong supplier")

    assert reversal.batch == original.batch
    assert reversal.entry_template == original.entry_template
    assert reversal.cost_center == original.cost_center
    assert reversal.competence_month == original.competence_month
    assert reversal.created_by == staff_user
    assert reversal.origin == CurrentAccountEntry.Origin.MANUAL
    assert reversal.justification == "Wrong supplier"
    assert reversal.description == f"Reversal of {original.registry}: {original.description}"


def test_the_original_is_not_changed(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry())

    reverse(original, staff_user)

    stored = CurrentAccountEntry.objects.get(pk=original.pk)
    assert stored.amount == original.amount
    assert stored.kind == original.kind
    assert stored.reversal_of is None


def test_an_entry_is_reversed_only_once(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry())
    reverse(original, staff_user)

    with pytest.raises(ValidationError) as error:
        reverse(original, staff_user)

    assert error.value.error_dict["reversal_of"][0].code == "current_account_entry.reversal_of.already_reversed"
    assert CurrentAccountEntry.objects.count() == 2


def test_a_reversal_cannot_be_reversed(make_entry: Any, staff_user: User) -> None:
    reversal = reverse(post_entry(make_entry()), staff_user)

    with pytest.raises(ValidationError) as error:
        reverse(reversal, staff_user)

    assert error.value.error_dict["reversal_of"][0].code == "current_account_entry.reversal_of.is_a_reversal"


def test_the_reason_is_required(make_entry: Any, staff_user: User, current_account: CurrentAccount) -> None:
    original = post_entry(make_entry(kind="debit", amount=Decimal("100.00")))

    with pytest.raises(ValidationError) as error:
        reverse(original, staff_user, reason="  ")

    assert error.value.error_dict["justification"][0].code == "current_account_entry.justification.blank"
    current_account.refresh_from_db()
    assert current_account.balance == Decimal("-100.00")


def test_a_reversal_must_have_the_opposite_kind(make_entry: Any, staff_user: User) -> None:
    original = post_entry(make_entry(kind="debit"))
    reversal = make_entry(kind="debit", reversal_of=original, justification="x")

    with pytest.raises(ValidationError) as error:
        reversal.full_clean()

    assert error.value.error_dict["reversal_of"][0].code == "current_account_entry.reversal_of.same_kind"


def test_a_reversal_must_have_the_same_amount(make_entry: Any) -> None:
    original = post_entry(make_entry(kind="debit", amount=Decimal("100.00")))
    reversal = make_entry(kind="credit", amount=Decimal("50.00"), reversal_of=original, justification="x")

    with pytest.raises(ValidationError) as error:
        reversal.full_clean()

    assert error.value.error_dict["reversal_of"][0].code == "current_account_entry.reversal_of.amount_differs"


def test_a_reversal_belongs_to_the_account_of_the_original(
    make_entry: Any, other_condominium: Any, company: Any
) -> None:
    from ..models import CostCenter, EntryTemplate

    original = post_entry(make_entry(kind="debit"))
    other_account = CurrentAccount.objects.create(company=company, condominium=other_condominium)
    other_center = CostCenter.objects.create(condominium=other_condominium, name="Normal")
    other_template = EntryTemplate.objects.create(cost_center=other_center, name="PG DMAE")
    reversal = make_entry(
        kind="credit",
        reversal_of=original,
        justification="x",
        current_account=other_account,
        cost_center=other_center,
        entry_template=other_template,
    )

    with pytest.raises(ValidationError) as error:
        reversal.full_clean()

    assert error.value.error_dict["reversal_of"][0].code == "current_account_entry.reversal_of.other_account"


def test_the_database_refuses_two_reversals_of_the_same_entry(make_entry: Any) -> None:
    original = post_entry(make_entry(kind="debit"))
    _ = make_entry(kind="credit", reversal_of=original, justification="x").save()

    with pytest.raises(IntegrityError), transaction.atomic():
        make_entry(kind="credit", reversal_of=original, justification="y").save()
