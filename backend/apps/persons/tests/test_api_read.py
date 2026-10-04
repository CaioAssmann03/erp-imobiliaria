from collections.abc import Callable

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ..models import Person
from .base import CNPJ_A, CPF_A, make_individual, make_legal

pytestmark = pytest.mark.django_db


def results(response: object) -> list[dict[str, object]]:
    return response.data["results"]  # pyright: ignore


def test_list_returns_nested_documents(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria", cpf=CPF_A)

    response = api_client.get(list_url)

    assert response.status_code == status.HTTP_200_OK
    assert results(response)[0]["people_individual"]["cpf"] == CPF_A  # pyright: ignore


def test_retrieve(api_client: APIClient, detail_url: Callable[[Person], str]) -> None:
    person = make_legal(cnpj=CNPJ_A)

    response = api_client.get(detail_url(person))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["people_legal"]["cnpj"] == CNPJ_A  # pyright: ignore


def test_search_by_name(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria Silva", cpf=CPF_A)
    _ = make_legal(name="Empresa LTDA", cnpj=CNPJ_A)

    response = api_client.get(list_url, {"query": "maria"})

    assert [p["name"] for p in results(response)] == ["Maria Silva"]


def test_search_by_cpf_and_cnpj(api_client: APIClient, list_url: str) -> None:
    _ = make_individual(name="Maria", cpf=CPF_A)
    _ = make_legal(name="Empresa", cnpj=CNPJ_A)

    by_cpf = api_client.get(list_url, {"query": CPF_A})
    by_cnpj = api_client.get(list_url, {"query": CNPJ_A})

    assert [p["name"] for p in results(by_cpf)] == ["Maria"]
    assert [p["name"] for p in results(by_cnpj)] == ["Empresa"]


def test_filter_by_active(api_client: APIClient, list_url: str) -> None:
    _ = Person.objects.create(name="Ativa", active=True)
    _ = Person.objects.create(name="Inativa", active=False)

    response = api_client.get(list_url, {"active": "false"})

    assert [p["name"] for p in results(response)] == ["Inativa"]


def test_delete(api_client: APIClient, detail_url: Callable[[Person], str]) -> None:
    person = make_individual()

    response = api_client.delete(detail_url(person))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Person.objects.exists()
