"""Settling an account payable posts its ledger debit in the same transaction (spec 015)."""

from datetime import date
from decimal import Decimal
from typing import Any
from unittest import mock

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User

from ..models import (
    AccountPayable,
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
)
from ..services.settle_account_payable import (
    AccountPayablePayment,
    settle_account_payable,
)
from .base import error_codes

pytestmark = pytest.mark.django_db

PAYMENT_DATE = date(2026, 10, 18)


def pay(account: AccountPayable, user: User, amount: str = "1250.00") -> AccountPayable:
    return settle_account_payable(account, AccountPayablePayment(PAYMENT_DATE, Decimal(amount), "pix", user))


def test_paying_a_condominium_expense_posts_a_debit(make_account: Any, staff_user: User, condominium: Any) -> None:
    account = make_account()

    pay(account, staff_user)

    entry = CurrentAccountEntry.objects.get()
    assert entry.kind == CurrentAccountEntry.Kind.DEBIT
    assert entry.origin == CurrentAccountEntry.Origin.AUTOMATIC_PAYABLE
    assert entry.account_payable == account
    assert entry.current_account.condominium == condominium
    assert entry.created_by == staff_user
    assert entry.justification == ""


def test_the_entry_carries_the_amount_paid_and_the_payment_date(make_account: Any, staff_user: User) -> None:
    account = make_account(amount=Decimal("1250.00"))

    pay(account, staff_user, amount="1190.40")

    entry = CurrentAccountEntry.objects.get()
    assert entry.amount == Decimal("1190.40")
    assert entry.entry_date == PAYMENT_DATE


def test_the_description_is_built_from_the_supplier_and_the_cost_center(
    make_account: Any, staff_user: User
) -> None:
    pay(make_account(), staff_user)

    assert CurrentAccountEntry.objects.get().description == "Companhia de Energia - Fundo de Reserva"


def test_the_competence_month_is_the_due_month(make_account: Any, staff_user: User) -> None:
    pay(make_account(due_date=date(2026, 9, 28)), staff_user)

    assert CurrentAccountEntry.objects.get().competence_month == date(2026, 9, 1)


def test_the_entry_uses_the_template_and_the_cost_center_of_the_account(
    make_account: Any, staff_user: User, entry_template: EntryTemplate, cost_center: CostCenter
) -> None:
    pay(make_account(), staff_user)

    entry = CurrentAccountEntry.objects.get()
    assert entry.entry_template == entry_template
    assert entry.cost_center == cost_center


def test_each_payment_gets_a_bank_batch_dated_on_the_payment_day(make_account: Any, staff_user: User) -> None:
    pay(make_account(), staff_user)

    batch = CurrentAccountEntry.objects.get().batch
    assert batch.origin == EntryBatch.OriginType.BANK
    assert batch.cash_number is None
    assert batch.batch_date == PAYMENT_DATE


def test_the_balance_goes_down_by_the_amount_paid(make_account: Any, staff_user: User, condominium: Any) -> None:
    pay(make_account(), staff_user, amount="1250.00")
    pay(make_account(description="Água"), staff_user, amount="100.50")

    account = CurrentAccount.objects.get(condominium=condominium)
    assert account.balance == Decimal("-1350.50")
    assert account.balance == account.recalculated_balance()


def test_the_current_account_is_created_on_the_first_payment_and_then_reused(
    make_account: Any, staff_user: User
) -> None:
    assert not CurrentAccount.objects.exists()

    pay(make_account(), staff_user)
    pay(make_account(description="Água"), staff_user)

    assert CurrentAccount.objects.count() == 1


def test_an_existing_current_account_is_reused(make_account: Any, staff_user: User, current_account: CurrentAccount) -> None:
    pay(make_account(), staff_user)

    assert CurrentAccount.objects.get() == current_account


def test_a_company_expense_posts_nothing(make_account: Any, staff_user: User) -> None:
    account = make_account(condominium=None, cost_center=None)

    pay(account, staff_user)

    account.refresh_from_db()
    assert account.status == AccountPayable.Status.PAID
    assert not CurrentAccountEntry.objects.exists()
    assert not CurrentAccount.objects.exists()


def test_a_condominium_expense_without_entry_template_cannot_be_paid(
    make_account: Any, staff_user: User
) -> None:
    account = make_account(entry_template=None)

    with pytest.raises(ValidationError) as error:
        pay(account, staff_user)

    assert error.value.error_dict["entry_template"][0].code == "account_payable.entry_template.required_to_pay"
    assert AccountPayable.objects.get(pk=account.pk).status == AccountPayable.Status.OPEN
    assert not CurrentAccountEntry.objects.exists()
    assert not EntryBatch.objects.exists()


def test_a_failure_while_posting_leaves_the_account_open(make_account: Any, staff_user: User) -> None:
    account = make_account()

    with mock.patch.object(CurrentAccountEntry, "save", side_effect=RuntimeError("boom")), pytest.raises(RuntimeError):
        pay(account, staff_user)

    assert AccountPayable.objects.get(pk=account.pk).status == AccountPayable.Status.OPEN
    assert not EntryBatch.objects.exists()
    assert not CurrentAccount.objects.exists()


def test_an_inactive_entry_template_refuses_the_payment(
    make_account: Any, staff_user: User, entry_template: EntryTemplate
) -> None:
    account = make_account()
    EntryTemplate.objects.filter(pk=entry_template.pk).update(active=False)
    account.refresh_from_db()

    with pytest.raises(ValidationError):
        pay(account, staff_user)

    assert AccountPayable.objects.get(pk=account.pk).status == AccountPayable.Status.OPEN


# ----- payable rules about the entry template -----


def test_the_entry_template_must_belong_to_the_cost_center_of_the_account(
    make_account: Any, other_condominium: Any
) -> None:
    other_center = CostCenter.objects.create(condominium=other_condominium, name="Normal")
    other_template = EntryTemplate.objects.create(cost_center=other_center, name="PG DMAE")
    account = make_account()
    account.entry_template = other_template

    with pytest.raises(ValidationError) as error:
        account.full_clean()

    assert error.value.error_dict["entry_template"][0].code == "account_payable.entry_template.other_cost_center"


def test_a_company_expense_has_no_entry_template(make_account: Any, entry_template: EntryTemplate) -> None:
    account = make_account(condominium=None, cost_center=None)
    account.entry_template = entry_template

    with pytest.raises(ValidationError) as error:
        account.full_clean()

    assert (
        error.value.error_dict["entry_template"][0].code
        == "account_payable.entry_template.not_allowed_for_company_expense"
    )


# ----- through the API -----


def test_the_settle_action_posts_the_entry_with_the_user_of_the_request(
    api_client: APIClient, make_account: Any, staff_user: User, condominium: Any
) -> None:
    account = make_account()

    response = api_client.post(
        reverse("account-payable-settle", args=[account.pk]),
        {"payment_date": "2026-10-18", "amount_paid": "1250.00", "payment_method": "pix"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    entry = CurrentAccountEntry.objects.get()
    assert entry.created_by == staff_user
    assert CurrentAccount.objects.get(condominium=condominium).balance == Decimal("-1250.00")


def test_the_settle_action_answers_a_coded_error_without_entry_template(
    api_client: APIClient, make_account: Any
) -> None:
    account = make_account(entry_template=None)

    response = api_client.post(
        reverse("account-payable-settle", args=[account.pk]),
        {"payment_date": "2026-10-18", "amount_paid": "1250.00", "payment_method": "pix"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "entry_template") == ["account_payable.entry_template.required_to_pay"]
    assert not CurrentAccountEntry.objects.exists()


def test_the_account_payable_response_carries_the_names(api_client: APIClient, make_account: Any) -> None:
    make_account()
    make_account(description="Despesa da empresa", condominium=None, cost_center=None)

    rows = {row["description"]: row for row in api_client.get(reverse("account-payable-list")).data["results"]}

    condominium_expense = rows["CEEE - energia elétrica"]
    assert condominium_expense["condominium_name"] == "Residencial Sol"
    assert condominium_expense["cost_center_name"] == "Fundo de Reserva"
    assert condominium_expense["entry_template_name"] == "PG CEEE"
    company_expense = rows["Despesa da empresa"]
    assert company_expense["condominium_name"] is None
    assert company_expense["entry_template_name"] is None
