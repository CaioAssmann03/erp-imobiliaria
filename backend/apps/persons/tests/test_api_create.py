import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ..models import PeopleIndividual, PeopleLegal, Person
from .base import CNPJ_A, CPF_A, body, error_codes, make_individual, make_legal

pytestmark = pytest.mark.django_db


def test_create_individual(api_client: APIClient, list_url: str) -> None:
    payload = {
        "name": "Maria Silva",
        "people_individual": {"cpf": CPF_A, "job": "Engenheira"},
    }

    response = api_client.post(list_url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    person = Person.objects.get(name="Maria Silva")
    assert person.people_individual.cpf == CPF_A
    assert person.people_individual.job == "Engenheira"


def test_create_legal(api_client: APIClient, list_url: str) -> None:
    payload = {"name": "Empresa", "people_legal": {"cnpj": CNPJ_A, "ie": "123"}}

    response = api_client.post(list_url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Person.objects.get(name="Empresa").people_legal.cnpj == CNPJ_A


def test_create_without_document(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(list_url, {"name": "Sem doc"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert not PeopleIndividual.objects.exists()
    assert not PeopleLegal.objects.exists()


def test_create_requires_name(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(list_url, {"email": "a@b.com"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "name") == ["required"]


def test_create_rejects_invalid_cpf(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(
        list_url,
        {"name": "Maria", "people_individual": {"cpf": "12345678901"}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not Person.objects.exists()


def test_create_rejects_invalid_cnpj(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(
        list_url,
        {"name": "Empresa", "people_legal": {"cnpj": "11222333000180"}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not Person.objects.exists()


def test_create_duplicate_cpf_is_rejected(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(cpf=CPF_A)

    response = api_client.post(
        list_url,
        {"name": "Outra", "people_individual": {"cpf": CPF_A}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Person.objects.count() == 1


def test_create_duplicate_cnpj_is_rejected(api_client: APIClient, list_url: str) -> None:
    _ = make_legal(cnpj=CNPJ_A)

    response = api_client.post(
        list_url,
        {"name": "Outra", "people_legal": {"cnpj": CNPJ_A}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Person.objects.count() == 1


def test_create_rejects_invalid_email(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(
        list_url, {"name": "Maria", "email": "nao-e-email"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "email") == ["invalid"]


def test_requires_authentication(list_url: str) -> None:
    response = APIClient().get(list_url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
