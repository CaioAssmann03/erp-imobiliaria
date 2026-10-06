"""Accounts payable: model rules, constraints and the closed states (spec 011, R3, R4, R7, R8, R10)."""

from datetime import date
from decimal import Decimal
from unittest import mock

import pytest
from auditlog.models import LogEntry
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.management.commands.seed_demo import _generate_cnpj
from apps.core.models import Company
from apps.persons.models import Person

from ..models import AccountPayable, CostCenter, Supplier
from ..services.settle_account_payable import (
    AccountPayablePayment,
    settle_account_payable,
)
from .base import error_codes, errors

pytestmark = pytest.mark.django_db

LIST = "account-payable-list"
DETAIL = "account-payable-detail"
SETTLE = "account-payable-settle"
CANCEL = "account-payable-cancel"

SETTLEMENT = {"payment_date": "2026-10-18", "amount_paid": "1250.00", "payment_method": "pix"}


def new_account(company, supplier, **fields) -> AccountPayable:  # type: ignore[no-untyped-def]
    """An unsaved account of the company (company expense unless the fields say otherwise)."""
    return AccountPayable(
        company=company,
        supplier=supplier,
        description="x",
        amount=Decimal("10.00"),
        due_date=date(2026, 10, 20),
        **fields,
    )


# ----- R3 -----


@pytest.mark.parametrize("amount", ["0", "0.00", "-1"])
def test_amount_must_be_positive(api_client: APIClient, condominium, cost_center, supplier, amount: str) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        reverse(LIST),
        {
            "supplier": str(supplier.pk),
            "condominium": str(condominium.pk),
            "cost_center": str(cost_center.pk),
            "description": "x",
            "amount": amount,
            "due_date": "2026-10-20",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "amount") == ["amount.not_positive"]


def test_due_date_cannot_be_before_issue_date(api_client: APIClient, supplier) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        reverse(LIST),
        {"supplier": str(supplier.pk), "description": "x", "amount": "5", "issue_date": "2026-10-20", "due_date": "2026-10-01"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "due_date") == ["account_payable.due_date.before_issue_date"]


def test_the_database_refuses_a_non_positive_amount(company, supplier) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = AccountPayable.objects.create(
            company=company, supplier=supplier, description="x", amount=Decimal("0"), due_date=date(2026, 10, 20)
        )


def test_the_database_refuses_due_before_issue(company, supplier) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = AccountPayable.objects.create(
            company=company,
            supplier=supplier,
            description="x",
            amount=Decimal("1"),
            issue_date=date(2026, 10, 20),
            due_date=date(2026, 10, 1),
        )


# ----- R4 -----


def test_condominium_expense_needs_a_cost_center(api_client: APIClient, condominium, supplier) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        reverse(LIST),
        {"supplier": str(supplier.pk), "condominium": str(condominium.pk), "description": "x", "amount": "5", "due_date": "2026-10-20"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cost_center") == ["account_payable.cost_center.required_for_condominium"]


def test_company_expense_has_no_cost_center(api_client: APIClient, cost_center, supplier) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        reverse(LIST),
        {"supplier": str(supplier.pk), "cost_center": str(cost_center.pk), "description": "x", "amount": "5", "due_date": "2026-10-20"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cost_center") == ["account_payable.cost_center.not_allowed_for_company_expense"]


def test_a_company_expense_without_condominium_is_valid(api_client: APIClient, supplier) -> None:  # type: ignore[no-untyped-def]
    response = api_client.post(
        reverse(LIST),
        {"supplier": str(supplier.pk), "description": "Aluguel da sala", "amount": "3000", "due_date": "2026-10-20"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert AccountPayable.objects.get().condominium is None


def test_cost_center_must_belong_to_the_condominium(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, other_condominium, supplier
) -> None:
    elsewhere = CostCenter.objects.create(condominium=other_condominium, name="Água")

    response = api_client.post(
        reverse(LIST),
        {
            "supplier": str(supplier.pk),
            "condominium": str(condominium.pk),
            "cost_center": str(elsewhere.pk),
            "description": "x",
            "amount": "5",
            "due_date": "2026-10-20",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cost_center") == ["account_payable.cost_center.other_condominium"]


def test_condominium_and_supplier_must_belong_to_the_company(  # type: ignore[no-untyped-def]
    company: Company, other_company: Company, supplier
) -> None:
    theirs = Condominium.objects.create(company=other_company, name="Alheio", cnpj=_generate_cnpj(12))
    their_cost_center = CostCenter.objects.create(condominium=theirs, name="Alheio")
    their_supplier = Supplier.objects.create(person=Person.objects.create(company=other_company, name="Alheia"))

    wrong_condominium = new_account(company, supplier, condominium=theirs, cost_center=their_cost_center)
    wrong_supplier = new_account(company, their_supplier)

    with pytest.raises(ValidationError) as condominium_error:
        wrong_condominium.clean()
    with pytest.raises(ValidationError) as supplier_error:
        wrong_supplier.clean()

    assert condominium_error.value.error_dict["condominium"][0].code == "account_payable.condominium.other_company"
    assert supplier_error.value.error_dict["supplier"][0].code == "account_payable.supplier.other_company"


def test_the_database_pairs_the_cost_center_with_the_condominium(company, condominium, supplier) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = AccountPayable.objects.create(
            company=company, supplier=supplier, condominium=condominium, description="x", amount=Decimal("1"), due_date=date(2026, 10, 20)
        )


# ----- R5 (atomicity) -----


def test_settle_is_atomic(make_account, staff_user) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    with mock.patch.object(AccountPayable, "save", side_effect=RuntimeError("boom")):
        with pytest.raises(RuntimeError):
            settle_account_payable(account, AccountPayablePayment(date(2026, 10, 18), Decimal("1250.00"), "pix", staff_user))

    stored = AccountPayable.objects.get(pk=account.pk)
    assert stored.status == "open"
    assert stored.payment_date is None and stored.amount_paid is None and stored.payment_method == ""


# ----- R7 -----


def test_a_paid_account_cannot_be_edited_settled_or_cancelled(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()
    _ = api_client.post(reverse(SETTLE, args=[account.pk]), SETTLEMENT, format="json")

    edited = api_client.patch(reverse(DETAIL, args=[account.pk]), {"description": "outra"}, format="json")
    settled_again = api_client.post(reverse(SETTLE, args=[account.pk]), SETTLEMENT, format="json")
    cancelled = api_client.post(reverse(CANCEL, args=[account.pk]), {}, format="json")

    for response in (edited, settled_again, cancelled):
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert errors(response)[0]["code"] == "account_payable.status.not_open"
    account.refresh_from_db()
    assert account.description != "outra" and account.status == "paid"


def test_a_cancelled_account_cannot_be_settled(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()
    _ = api_client.post(reverse(CANCEL, args=[account.pk]), {}, format="json")

    settled = api_client.post(reverse(SETTLE, args=[account.pk]), SETTLEMENT, format="json")
    cancelled_again = api_client.post(reverse(CANCEL, args=[account.pk]), {}, format="json")
    edited = api_client.patch(reverse(DETAIL, args=[account.pk]), {"description": "outra"}, format="json")

    for response in (settled, cancelled_again, edited):
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert errors(response)[0]["code"] == "account_payable.status.not_open"


def test_a_paid_account_cannot_be_deleted(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()
    _ = api_client.post(reverse(SETTLE, args=[account.pk]), SETTLEMENT, format="json")

    response = api_client.delete(reverse(DETAIL, args=[account.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "account_payable.deletion.is_paid"
    assert AccountPayable.objects.filter(pk=account.pk).exists()


def test_an_open_account_can_be_deleted(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    assert api_client.delete(reverse(DETAIL, args=[account.pk])).status_code == status.HTTP_204_NO_CONTENT


def test_a_cancelled_account_can_be_deleted(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()
    _ = api_client.post(reverse(CANCEL, args=[account.pk]), {}, format="json")

    assert api_client.delete(reverse(DETAIL, args=[account.pk])).status_code == status.HTTP_204_NO_CONTENT


def test_model_save_of_a_closed_account_is_refused(make_account, staff_user) -> None:  # type: ignore[no-untyped-def]
    account = make_account()
    settle_account_payable(account, AccountPayablePayment(date(2026, 10, 18), Decimal("1250.00"), "pix", staff_user))
    account.description = "mudou"

    with pytest.raises(ValidationError) as error:
        account.full_clean()

    assert error.value.error_dict["__all__"][0].code == "account_payable.status.not_open"


# ----- R8 -----


def test_payment_fields_only_when_paid(company, supplier) -> None:  # type: ignore[no-untyped-def]
    paid_without_data = new_account(company, supplier, status="paid")
    open_with_data = new_account(
        company, supplier, payment_date=date(2026, 10, 18), amount_paid=Decimal("1"), payment_method="pix"
    )

    with pytest.raises(ValidationError) as missing:
        paid_without_data.clean()
    with pytest.raises(ValidationError) as unexpected:
        open_with_data.clean()

    assert {field: errs[0].code for field, errs in missing.value.error_dict.items()} == {
        "payment_date": "account_payable.payment.required_when_paid",
        "amount_paid": "account_payable.payment.required_when_paid",
        "payment_method": "account_payable.payment.required_when_paid",
    }
    assert {field: errs[0].code for field, errs in unexpected.value.error_dict.items()} == {
        "payment_date": "account_payable.payment.not_allowed_unless_paid",
        "amount_paid": "account_payable.payment.not_allowed_unless_paid",
        "payment_method": "account_payable.payment.not_allowed_unless_paid",
    }


def test_the_database_refuses_inconsistent_payment_fields(company, supplier) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = AccountPayable.objects.create(
            company=company, supplier=supplier, description="x", amount=Decimal("1"), due_date=date(2026, 10, 20), status="paid"
        )
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = AccountPayable.objects.create(
            company=company, supplier=supplier, description="x", amount=Decimal("1"), due_date=date(2026, 10, 20),
            payment_date=date(2026, 10, 18), amount_paid=Decimal("1"), payment_method="pix",
        )


# ----- R10 -----


def test_changes_of_amount_and_due_date_are_in_the_audit_log(jwt_api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    _ = jwt_api_client.patch(
        reverse(DETAIL, args=[account.pk]), {"amount": "1400.00", "due_date": "2026-10-25"}, format="json"
    )
    _ = jwt_api_client.post(reverse(SETTLE, args=[account.pk]), SETTLEMENT, format="json")

    entries = list(LogEntry.objects.get_for_object(account).order_by("timestamp"))
    edit, settlement = entries[-2], entries[-1]
    assert edit.changes["amount"] == ["1250.00", "1400.00"]
    assert edit.changes["due_date"] == ["2026-10-20", "2026-10-25"]
    assert edit.actor is not None
    assert settlement.changes["status"] == ["open", "paid"]
