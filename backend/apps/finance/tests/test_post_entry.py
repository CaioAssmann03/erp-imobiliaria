"""Posting a ledger entry moves the balance of its account in the same transaction (roadmap phase 3 part 04, stage B)."""

from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError

from apps.core.models import Company

from ..models import CurrentAccount, CurrentAccountEntry
from ..services.post_entry import post_entry

pytestmark = pytest.mark.django_db


def test_a_credit_increases_the_balance(current_account: CurrentAccount, make_entry: Any) -> None:
    post_entry(make_entry(kind="credit", amount=Decimal("500.00")))

    current_account.refresh_from_db()
    assert current_account.balance == Decimal("500.00")


def test_a_debit_decreases_the_balance(current_account: CurrentAccount, make_entry: Any) -> None:
    post_entry(make_entry(kind="credit", amount=Decimal("500.00")))
    post_entry(make_entry(kind="debit", amount=Decimal("100.00")))

    current_account.refresh_from_db()
    assert current_account.balance == Decimal("400.00")


def test_the_balance_may_go_negative(current_account: CurrentAccount, make_entry: Any) -> None:
    post_entry(make_entry(kind="debit", amount=Decimal("30.00")))

    current_account.refresh_from_db()
    assert current_account.balance == Decimal("-30.00")


def test_the_stored_balance_matches_the_sum_of_the_entries(
    current_account: CurrentAccount, make_entry: Any
) -> None:
    for kind, amount in (("credit", "300.00"), ("debit", "120.50"), ("credit", "10.25"), ("debit", "0.75")):
        post_entry(make_entry(kind=kind, amount=Decimal(amount)))

    current_account.refresh_from_db()
    assert current_account.balance == current_account.recalculated_balance() == Decimal("189.00")


def test_the_posted_entry_is_saved_and_has_a_registry(make_entry: Any) -> None:
    entry = post_entry(make_entry())

    assert CurrentAccountEntry.objects.filter(pk=entry.pk).exists()
    assert entry.registry is not None


def test_an_invalid_entry_saves_nothing_and_keeps_the_balance(
    current_account: CurrentAccount, make_entry: Any
) -> None:
    with pytest.raises(ValidationError):
        post_entry(make_entry(amount=Decimal(0)))

    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)
    assert not CurrentAccountEntry.objects.exists()


def test_an_account_of_another_company_is_refused_and_keeps_the_balance(
    current_account: CurrentAccount, make_entry: Any, other_company: Company
) -> None:
    with pytest.raises(ValidationError):
        post_entry(make_entry(company=other_company))

    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)
    assert not CurrentAccountEntry.objects.exists()


def test_a_failure_while_moving_the_balance_undoes_the_entry(
    current_account: CurrentAccount, make_entry: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("balance update failed")

    monkeypatch.setattr(CurrentAccount, "save", fail)

    with pytest.raises(RuntimeError):
        post_entry(make_entry())

    assert not CurrentAccountEntry.objects.exists()


def test_a_batch_of_entries_is_posted_all_together(current_account: CurrentAccount, make_entry: Any) -> None:
    from ..services.post_entries import post_entries

    posted = post_entries([make_entry(kind="credit", amount=Decimal("100.00")), make_entry(kind="debit", amount=Decimal("30.00"))])

    assert [entry.registry for entry in posted] == sorted(entry.registry for entry in posted)
    current_account.refresh_from_db()
    assert current_account.balance == Decimal("70.00")


def test_a_batch_with_a_refused_entry_saves_none(current_account: CurrentAccount, make_entry: Any) -> None:
    from ..services.post_entries import post_entries

    with pytest.raises(ValidationError):
        post_entries([make_entry(kind="credit", amount=Decimal("100.00")), make_entry(amount=Decimal(0))])

    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)
    assert not CurrentAccountEntry.objects.exists()
