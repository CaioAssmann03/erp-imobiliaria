"""Bank accounts (spec 010, R4, R5, R6, R7)."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.seed.documents import generate_cnpj
from apps.core.models import Company

from ..models import BankAccount
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "bank-account-list"
DETAIL = "bank-account-detail"

PAYLOAD = {
    "bank_code": "033",
    "bank_name": "Santander",
    "branch": "1541",
    "account_number": "00716979-5",
    "kind": "checking",
    "nickname": "Conta Movimento",
}


# ----- R4 -----


def test_crud(api_client: APIClient, company: Company) -> None:
    created = api_client.post(reverse(LIST), PAYLOAD, format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert body(created)["condominium"] is None

    detail = reverse(DETAIL, args=[body(created)["id"]])
    assert api_client.get(detail).status_code == status.HTTP_200_OK
    patched = api_client.patch(detail, {"nickname": "Conta Aplicação", "kind": "savings"}, format="json")
    assert patched.status_code == status.HTTP_200_OK
    assert body(patched)["kind"] == "savings"
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
    assert not BankAccount.objects.exists()


def test_company_is_the_users_and_read_only(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    response = api_client.post(
        reverse(LIST), {**PAYLOAD, "company": str(other_company.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    account = BankAccount.objects.get(pk=body(response)["id"])
    assert account.company == company
    assert body(response)["company"] == company.pk
    patched = api_client.patch(
        reverse(DETAIL, args=[account.pk]), {"company": str(other_company.pk)}, format="json"
    )
    account.refresh_from_db()
    assert patched.status_code == status.HTTP_200_OK
    assert account.company == company


def test_filters_and_search(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    _ = BankAccount.objects.create(company=company, nickname="Conta Movimento", bank_name="Santander", **{k: v for k, v in PAYLOAD.items() if k in ("bank_code", "branch", "account_number")})
    _ = BankAccount.objects.create(
        company=company, nickname="Aplicação", bank_name="Itaú", bank_code="341", branch="1", account_number="2", kind="savings", active=False
    )
    _ = BankAccount.objects.create(
        company=company, condominium=condominium, nickname="Do condomínio", bank_code="001", branch="3", account_number="4"
    )

    by_condominium = results(api_client.get(reverse(LIST), {"condominium": str(condominium.pk)}))
    savings = results(api_client.get(reverse(LIST), {"kind": "savings"}))
    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    by_name = results(api_client.get(reverse(LIST), {"query": "itaú"}))
    by_nickname = results(api_client.get(reverse(LIST), {"query": "movimento"}))
    by_account_number = results(api_client.get(reverse(LIST), {"query": "00716979"}))

    assert [item["nickname"] for item in by_condominium] == ["Do condomínio"]
    assert [item["nickname"] for item in savings] == ["Aplicação"]
    assert [item["nickname"] for item in inactive] == ["Aplicação"]
    assert [item["nickname"] for item in by_name] == ["Aplicação"]
    assert [item["nickname"] for item in by_nickname] == ["Conta Movimento"]
    assert by_account_number == []  # the account number is not searchable


def test_list_is_paginated_and_ordered(api_client: APIClient, company: Company) -> None:
    for nickname, number in (("B", "1"), ("A", "2"), ("C", "3")):
        _ = BankAccount.objects.create(
            company=company, nickname=nickname, bank_code="033", branch="1", account_number=number
        )

    response = api_client.get(reverse(LIST))

    assert set(body(response)) == {"count", "next", "previous", "results"}
    assert [item["nickname"] for item in results(response)] == ["A", "B", "C"]


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(LIST)).status_code == status.HTTP_401_UNAUTHORIZED


# ----- R5 -----


@pytest.mark.parametrize("bank_code", ["33", "0331", "abc", ""])
def test_bank_code_must_have_three_digits(api_client: APIClient, bank_code: str) -> None:
    response = api_client.post(reverse(LIST), {**PAYLOAD, "bank_code": bank_code}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "bank_code")[0] in ("bank_code.invalid_format", "blank")


def test_duplicate_account_for_the_same_holder_is_a_400(
    api_client: APIClient, company: Company
) -> None:
    _ = BankAccount.objects.create(
        company=company, bank_code="033", branch="1541", account_number="00716979-5"
    )

    response = api_client.post(reverse(LIST), PAYLOAD, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "bank_account.account_number.duplicate_for_holder"


def test_the_database_refuses_a_duplicate_account(company: Company) -> None:
    _ = BankAccount.objects.create(company=company, bank_code="033", branch="1", account_number="2")

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BankAccount.objects.create(company=company, bank_code="033", branch="1", account_number="2")


def test_same_account_is_allowed_in_another_company(
    api_client: APIClient, other_company: Company, company: Company
) -> None:
    _ = BankAccount.objects.create(
        company=other_company, bank_code="033", branch="1541", account_number="00716979-5"
    )

    response = api_client.post(reverse(LIST), PAYLOAD, format="json")

    assert response.status_code == status.HTTP_201_CREATED


def test_a_condominium_account_does_not_clash_with_the_companys(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    _ = BankAccount.objects.create(
        company=company, bank_code="033", branch="1541", account_number="00716979-5"
    )

    response = api_client.post(
        reverse(LIST), {**PAYLOAD, "condominium": str(condominium.pk)}, format="json"
    )
    again = api_client.post(
        reverse(LIST), {**PAYLOAD, "condominium": str(condominium.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert again.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(again)[0]["code"] == "bank_account.account_number.duplicate_for_holder"


# ----- R6 -----


def test_condominium_of_another_company_is_rejected(
    company: Company, other_company: Company
) -> None:
    theirs = Condominium.objects.create(
        company=other_company, name="Alheio", cnpj=generate_cnpj(9)
    )
    account = BankAccount(
        company=company, condominium=theirs, bank_code="033", branch="1", account_number="2"
    )

    with pytest.raises(ValidationError) as error:
        account.clean()

    assert error.value.error_dict["condominium"][0].code == "bank_account.condominium.other_company"


def test_condominium_account_of_the_same_company_is_accepted(
    company: Company, condominium: Condominium
) -> None:
    BankAccount(
        company=company, condominium=condominium, bank_code="033", branch="1", account_number="2"
    ).clean()


def test_foreign_condominium_is_does_not_exist_in_the_api(
    api_client: APIClient, other_company: Company
) -> None:
    theirs = Condominium.objects.create(company=other_company, name="Alheio", cnpj=generate_cnpj(9))

    response = api_client.post(
        reverse(LIST), {**PAYLOAD, "condominium": str(theirs.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "condominium") == ["does_not_exist"]


# ----- R7 -----


def test_other_company_is_404(api_client: APIClient, other_company: Company) -> None:
    theirs = BankAccount.objects.create(
        company=other_company, bank_code="033", branch="1", account_number="2"
    )

    detail = api_client.get(reverse(DETAIL, args=[theirs.pk]))
    listed = results(api_client.get(reverse(LIST)))

    assert detail.status_code == status.HTTP_404_NOT_FOUND
    assert listed == []
