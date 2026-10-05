"""Suppliers (spec 010, R1, R2, R3, R7)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.persons.models import PeopleIndividual, PeopleLegal, Person
from apps.persons.tests.base import CNPJ_A, CPF_A

from ..models import Supplier
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "supplier-list"
DETAIL = "supplier-detail"


def make_person(company: Company, name: str, cpf: str | None = None, cnpj: str | None = None) -> Person:
    person = Person.objects.create(company=company, name=name)
    if cpf:
        _ = PeopleIndividual.objects.create(person=person, company=company, cpf=cpf)
    if cnpj:
        _ = PeopleLegal.objects.create(person=person, company=company, cnpj=cnpj)
    return person


# ----- R1 -----


def test_crud(api_client: APIClient, person: Person) -> None:
    created = api_client.post(
        reverse(LIST),
        {
            "person": str(person.pk),
            "bank_code": "033",
            "branch": "1541",
            "account_number": "00716979-5",
            "account_kind": "checking",
            "pix_key": "pagamentos@energia.example",
        },
        format="json",
    )
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert body(created)["person_detail"]["name"] == "Companhia de Energia"
    assert body(created)["active"] is True

    detail = reverse(DETAIL, args=[body(created)["id"]])
    assert api_client.get(detail).status_code == status.HTTP_200_OK
    patched = api_client.patch(detail, {"active": False}, format="json")
    assert patched.status_code == status.HTTP_200_OK
    assert body(patched)["active"] is False
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
    assert not Supplier.objects.exists()


def test_filters_and_search_by_name_and_document(api_client: APIClient, company: Company) -> None:
    energy = make_person(company, "Companhia de Energia", cnpj=CNPJ_A)
    plumber = make_person(company, "João Encanador", cpf=CPF_A)
    _ = Supplier.objects.create(person=energy)
    _ = Supplier.objects.create(person=plumber, active=False, pix_key="chave-secreta")

    by_name = results(api_client.get(reverse(LIST), {"query": "energia"}))
    by_cpf = results(api_client.get(reverse(LIST), {"query": CPF_A}))
    by_cnpj = results(api_client.get(reverse(LIST), {"query": CNPJ_A}))
    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    by_person = results(api_client.get(reverse(LIST), {"person": str(energy.pk)}))
    by_pix = results(api_client.get(reverse(LIST), {"query": "chave-secreta"}))

    assert [item["person_detail"]["name"] for item in by_name] == ["Companhia de Energia"]
    assert [item["person_detail"]["name"] for item in by_cpf] == ["João Encanador"]
    assert [item["person_detail"]["name"] for item in by_cnpj] == ["Companhia de Energia"]
    assert [item["person_detail"]["name"] for item in inactive] == ["João Encanador"]
    assert len(by_person) == 1
    assert by_pix == []  # payment data is not searchable


def test_list_is_paginated_and_ordered(api_client: APIClient, company: Company) -> None:
    for name in ("Zeca", "Ana", "Mário"):
        _ = Supplier.objects.create(person=make_person(company, name))

    response = api_client.get(reverse(LIST))

    assert set(body(response)) == {"count", "next", "previous", "results"}
    assert [item["person_detail"]["name"] for item in results(response)] == ["Ana", "Mário", "Zeca"]


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(LIST)).status_code == status.HTTP_401_UNAUTHORIZED


# ----- R2 -----


def test_a_person_is_a_supplier_only_once(api_client: APIClient, person: Person) -> None:
    _ = Supplier.objects.create(person=person)

    response = api_client.post(reverse(LIST), {"person": str(person.pk)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "person") == ["unique"]
    assert Supplier.objects.count() == 1


def test_foreign_person_is_does_not_exist(api_client: APIClient, other_company: Company) -> None:
    theirs = make_person(other_company, "Alheia")

    response = api_client.post(reverse(LIST), {"person": str(theirs.pk)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "person") == ["does_not_exist"]


# ----- R3 -----


@pytest.mark.parametrize(
    ("given", "missing"),
    [
        ({"bank_code": "033"}, {"branch", "account_number"}),
        ({"branch": "1541"}, {"bank_code", "account_number"}),
        ({"bank_code": "033", "account_number": "123"}, {"branch"}),
    ],
)
def test_incomplete_bank_data_is_a_400(
    api_client: APIClient, person: Person, given: dict[str, str], missing: set[str]
) -> None:
    response = api_client.post(reverse(LIST), {"person": str(person.pk), **given}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert {item["field"] for item in errors(response)} == missing
    assert all(item["code"] == "supplier.bank_data.incomplete" for item in errors(response))


def test_supplier_without_payment_data_is_valid(api_client: APIClient, person: Person) -> None:
    response = api_client.post(reverse(LIST), {"person": str(person.pk)}, format="json")

    assert response.status_code == status.HTTP_201_CREATED


def test_supplier_with_only_a_pix_key_is_valid(api_client: APIClient, person: Person) -> None:
    response = api_client.post(
        reverse(LIST), {"person": str(person.pk), "pix_key": "11222333000181"}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED


def test_complete_bank_data_is_valid(api_client: APIClient, person: Person) -> None:
    response = api_client.post(
        reverse(LIST),
        {"person": str(person.pk), "bank_code": "001", "branch": "1", "account_number": "2"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED


def test_bank_code_must_have_three_digits(api_client: APIClient, person: Person) -> None:
    response = api_client.post(
        reverse(LIST),
        {"person": str(person.pk), "bank_code": "33", "branch": "1", "account_number": "2"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "bank_code") == ["bank_code.invalid_format"]


# ----- R7 -----


def test_other_company_is_404(api_client: APIClient, other_company: Company) -> None:
    theirs = Supplier.objects.create(person=make_person(other_company, "Alheia"))

    detail = api_client.get(reverse(DETAIL, args=[theirs.pk]))
    listed = results(api_client.get(reverse(LIST)))

    assert detail.status_code == status.HTTP_404_NOT_FOUND
    assert listed == []
