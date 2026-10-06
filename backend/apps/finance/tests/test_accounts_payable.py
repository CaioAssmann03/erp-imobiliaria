"""Accounts payable: API and life cycle (spec 011, R1, R2, R5, R6, R9)."""

import pytest
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
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "account-payable-list"
DETAIL = "account-payable-detail"
SETTLE = "account-payable-settle"
CANCEL = "account-payable-cancel"


def payload(
    condominium: Condominium, cost_center: CostCenter, supplier: Supplier, **extra: object
) -> dict[str, object]:
    return {
        "supplier": str(supplier.pk),
        "condominium": str(condominium.pk),
        "cost_center": str(cost_center.pk),
        "description": "CEEE - energia elétrica",
        "document_number": "NF 1042238",
        "amount": "1250.00",
        "issue_date": "2026-10-01",
        "due_date": "2026-10-20",
        **extra,
    }


# ----- R1 -----


def test_crud(api_client: APIClient, condominium, cost_center, supplier) -> None:  # type: ignore[no-untyped-def]
    created = api_client.post(reverse(LIST), payload(condominium, cost_center, supplier), format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert body(created)["amount"] == "1250.00"
    assert body(created)["supplier_name"] == "Companhia de Energia"

    detail = reverse(DETAIL, args=[body(created)["id"]])
    assert api_client.get(detail).status_code == status.HTTP_200_OK
    patched = api_client.patch(detail, {"description": "CEEE - novembro", "amount": "1300.50"}, format="json")
    assert patched.status_code == status.HTTP_200_OK
    assert body(patched)["amount"] == "1300.50"
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
    assert not AccountPayable.objects.exists()


def test_filters(api_client: APIClient, company: Company, condominium, cost_center, supplier, make_account) -> None:  # type: ignore[no-untyped-def]
    from datetime import date

    _ = make_account(description="Aberta", due_date=date(2026, 10, 10))
    paid = make_account(description="Paga", due_date=date(2026, 10, 20))
    settle_account_payable(paid, AccountPayablePayment(date(2026, 10, 19), paid.amount, "pix"))
    _ = make_account(description="Despesa da empresa", condominium=None, cost_center=None, due_date=date(2026, 11, 5))
    other_person = Person.objects.create(company=company, name="Outro fornecedor")
    other_supplier = Supplier.objects.create(person=other_person)
    _ = make_account(description="De outro fornecedor", supplier=other_supplier, due_date=date(2026, 12, 1))

    def names(**params: str) -> set[str]:
        return {item["description"] for item in results(api_client.get(reverse(LIST), params))}

    assert names(status="paid") == {"Paga"}
    assert names(status="open") == {"Aberta", "Despesa da empresa", "De outro fornecedor"}
    assert names(supplier=str(other_supplier.pk)) == {"De outro fornecedor"}
    assert names(condominium=str(condominium.pk)) == {"Aberta", "Paga", "De outro fornecedor"}
    assert names(cost_center=str(cost_center.pk)) == {"Aberta", "Paga", "De outro fornecedor"}
    assert names(is_company_expense="true") == {"Despesa da empresa"}
    assert names(is_company_expense="false") == {"Aberta", "Paga", "De outro fornecedor"}
    assert names(due_date_after="2026-10-20") == {"Paga", "Despesa da empresa", "De outro fornecedor"}
    assert names(due_date_before="2026-10-20") == {"Aberta", "Paga"}
    assert names(due_date_after="2026-10-11", due_date_before="2026-11-30") == {"Paga", "Despesa da empresa"}


def test_search(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    _ = make_account(description="Conta de água", document_number="DMAE-77")
    _ = make_account(description="Elevador", document_number="OTIS-1")

    def names(term: str) -> set[str]:
        return {item["description"] for item in results(api_client.get(reverse(LIST), {"query": term}))}

    assert names("água") == {"Conta de água"}
    assert names("otis") == {"Elevador"}
    assert names("companhia") == {"Conta de água", "Elevador"}  # the supplier's name


def test_list_is_paginated_and_ordered_by_due_date(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    from datetime import date

    _ = make_account(description="C", due_date=date(2026, 12, 1))
    _ = make_account(description="A", due_date=date(2026, 10, 1))
    _ = make_account(description="B", due_date=date(2026, 11, 1))

    response = api_client.get(reverse(LIST))

    assert set(body(response)) == {"count", "next", "previous", "results"}
    assert [item["description"] for item in results(response)] == ["A", "B", "C"]


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(LIST)).status_code == status.HTTP_401_UNAUTHORIZED


# ----- R2 -----


def test_a_new_account_is_open_and_company_is_the_users(  # type: ignore[no-untyped-def]
    api_client: APIClient, company: Company, other_company: Company, condominium, cost_center, supplier
) -> None:
    response = api_client.post(
        reverse(LIST),
        payload(condominium, cost_center, supplier, company=str(other_company.pk)),
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert body(response)["status"] == "open"
    assert body(response)["company"] == company.pk
    assert AccountPayable.objects.get().company == company


def test_status_and_payment_fields_are_read_only(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, cost_center, supplier, make_account
) -> None:
    created = api_client.post(
        reverse(LIST),
        payload(
            condominium,
            cost_center,
            supplier,
            status="paid",
            payment_date="2026-10-01",
            amount_paid="1.00",
            payment_method="pix",
        ),
        format="json",
    )
    account = make_account()
    patched = api_client.patch(
        reverse(DETAIL, args=[account.pk]), {"status": "paid", "amount_paid": "5.00"}, format="json"
    )

    assert created.status_code == status.HTTP_201_CREATED
    assert body(created)["status"] == "open"
    assert body(created)["payment_date"] is None
    assert patched.status_code == status.HTTP_200_OK
    account.refresh_from_db()
    assert account.status == "open" and account.amount_paid is None


# ----- R5, R6 -----


def test_settle(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(
        reverse(SETTLE, args=[account.pk]),
        {"payment_date": "2026-10-18", "amount_paid": "1250.00", "payment_method": "boleto"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert body(response)["status"] == "paid"
    assert body(response)["payment_date"] == "2026-10-18"
    assert body(response)["payment_method"] == "boleto"
    account.refresh_from_db()
    assert account.status == "paid"


def test_amount_paid_may_differ_from_the_amount(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(
        reverse(SETTLE, args=[account.pk]),
        {"payment_date": "2026-10-25", "amount_paid": "1291.67", "payment_method": "pix"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["amount"] == "1250.00"
    assert body(response)["amount_paid"] == "1291.67"


@pytest.mark.parametrize("amount_paid", ["0", "0.00", "-5"])
def test_settle_needs_a_positive_amount_paid(api_client: APIClient, make_account, amount_paid: str) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(
        reverse(SETTLE, args=[account.pk]),
        {"payment_date": "2026-10-18", "amount_paid": amount_paid, "payment_method": "pix"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "amount_paid") == ["amount.not_positive"]
    account.refresh_from_db()
    assert account.status == "open"


def test_settle_needs_all_the_fields(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(reverse(SETTLE, args=[account.pk]), {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert {item["field"] for item in errors(response)} == {"payment_date", "amount_paid", "payment_method"}


def test_settle_rejects_an_unknown_method(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(
        reverse(SETTLE, args=[account.pk]),
        {"payment_date": "2026-10-18", "amount_paid": "1", "payment_method": "cheque"},
        format="json",
    )

    assert error_codes(response, "payment_method") == ["invalid_choice"]


def test_cancel(api_client: APIClient, make_account) -> None:  # type: ignore[no-untyped-def]
    account = make_account()

    response = api_client.post(reverse(CANCEL, args=[account.pk]), {}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["status"] == "cancelled"
    assert body(response)["payment_date"] is None


# ----- R9 -----


def test_other_company_is_404_and_foreign_ids_are_does_not_exist(  # type: ignore[no-untyped-def]
    api_client: APIClient, other_company: Company, condominium, cost_center, supplier
) -> None:
    their_condominium = Condominium.objects.create(
        company=other_company, name="Alheio", cnpj=_generate_cnpj(11)
    )
    their_cost_center = CostCenter.objects.create(condominium=their_condominium, name="Alheio")
    their_supplier = Supplier.objects.create(person=Person.objects.create(company=other_company, name="Alheia"))
    theirs = AccountPayable.objects.create(
        company=other_company,
        condominium=their_condominium,
        cost_center=their_cost_center,
        supplier=their_supplier,
        description="Alheia",
        amount="10.00",
        due_date="2026-10-20",
    )

    detail = api_client.get(reverse(DETAIL, args=[theirs.pk]))
    settle = api_client.post(
        reverse(SETTLE, args=[theirs.pk]),
        {"payment_date": "2026-10-18", "amount_paid": "10", "payment_method": "pix"},
        format="json",
    )
    created = api_client.post(
        reverse(LIST),
        payload(their_condominium, their_cost_center, their_supplier),
        format="json",
    )

    assert detail.status_code == status.HTTP_404_NOT_FOUND
    assert settle.status_code == status.HTTP_404_NOT_FOUND
    assert results(api_client.get(reverse(LIST))) == []
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]
    assert error_codes(created, "cost_center") == ["does_not_exist"]
    assert error_codes(created, "supplier") == ["does_not_exist"]
