from collections.abc import Callable

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company
from ..models import Person
from .base import CNPJ_A, CPF_A, body, make_individual, make_legal, results

pytestmark = pytest.mark.django_db


def test_list_returns_nested_documents(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria", cpf=CPF_A)

    response = api_client.get(list_url)

    assert response.status_code == status.HTTP_200_OK
    assert results(response)[0]["people_individual"]["cpf"] == CPF_A


def test_retrieve(api_client: APIClient, detail_url: Callable[[Person], str]) -> None:
    person = make_legal(cnpj=CNPJ_A)

    response = api_client.get(detail_url(person))

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["people_legal"]["cnpj"] == CNPJ_A


def test_search_by_name(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria Silva", cpf=CPF_A)
    _ = make_legal(name="Empresa LTDA", cnpj=CNPJ_A)

    response = api_client.get(list_url, {"query": "maria"})

    assert [person["name"] for person in results(response)] == ["Maria Silva"]


def test_search_by_cpf_and_cnpj(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria", cpf=CPF_A)
    _ = make_legal(name="Empresa", cnpj=CNPJ_A)

    by_cpf = api_client.get(list_url, {"query": CPF_A})
    by_cnpj = api_client.get(list_url, {"query": CNPJ_A})

    assert [person["name"] for person in results(by_cpf)] == ["Maria"]
    assert [person["name"] for person in results(by_cnpj)] == ["Empresa"]


def test_filter_by_active(api_client: APIClient, list_url: str) -> None:
    _ = Person.objects.create(company=seeded_company(), name="Ativa", active=True)
    _ = Person.objects.create(company=seeded_company(), name="Inativa", active=False)

    response = api_client.get(list_url, {"active": "false"})

    assert [person["name"] for person in results(response)] == ["Inativa"]


def test_delete(api_client: APIClient, detail_url: Callable[[Person], str]) -> None:
    person = make_individual()

    response = api_client.delete(detail_url(person))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Person.objects.exists()


def test_filter_by_type(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria", cpf=CPF_A)
    _ = make_legal(name="Empresa", cnpj=CNPJ_A)
    _ = Person.objects.create(company=seeded_company(), name="Sem documento")

    individuals = api_client.get(list_url, {"type": "individual"})
    legals = api_client.get(list_url, {"type": "legal"})

    assert [person["name"] for person in results(individuals)] == ["Maria"]
    assert [person["name"] for person in results(legals)] == ["Empresa"]


def test_filter_by_invalid_type_is_rejected(api_client: APIClient, list_url: str) -> None:
    response = api_client.get(list_url, {"type": "outro"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
