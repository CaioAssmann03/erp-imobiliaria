import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from ..models import Block, Condominium, Unit
from .base import body, results

pytestmark = pytest.mark.django_db

LIST_ROUTES = ("condominium-list", "block-list", "unit-list", "unit-person-list")


@pytest.fixture
def client(api_client: APIClient) -> APIClient:
    return api_client


@pytest.mark.parametrize("route", LIST_ROUTES)
def test_list_is_paginated(client: APIClient, route: str) -> None:
    response = client.get(reverse(route))

    assert response.status_code == status.HTTP_200_OK
    assert set(body(response)) == {"count", "next", "previous", "results"}


@pytest.mark.parametrize("route", LIST_ROUTES)
def test_list_requires_authentication(route: str) -> None:
    assert APIClient().get(reverse(route)).status_code == status.HTTP_401_UNAUTHORIZED


def test_page_size_and_limit(client: APIClient, condominium: Condominium) -> None:
    for number in range(25):
        _ = Unit.objects.create(condominium=condominium, name=str(number))

    default = body(client.get(reverse("unit-list")))
    limited = body(client.get(reverse("unit-list"), {"limit": 5, "page": 2}))
    capped = body(client.get(reverse("unit-list"), {"limit": 1000}))

    assert default["count"] == 25
    assert len(default["results"]) == 20
    assert default["next"] is not None
    assert len(limited["results"]) == 5
    assert len(capped["results"]) == 25  # max_page_size=100 > 25


def test_filters_and_search(client: APIClient, company: Company, condominium: Condominium) -> None:
    other = Condominium.objects.create(
        company=company, name="Outro Prédio", cnpj="45723174000110", active=False
    )
    block = Block.objects.create(condominium=condominium, name="A")
    _ = Unit.objects.create(condominium=condominium, block=block, name="101")
    _ = Unit.objects.create(condominium=other, name="202")

    by_active = body(client.get(reverse("condominium-list"), {"active": "false"}))
    by_search = body(client.get(reverse("condominium-list"), {"query": "sol"}))
    by_condominium = body(client.get(reverse("unit-list"), {"condominium": str(other.pk)}))
    blocks = body(client.get(reverse("block-list"), {"condominium": str(condominium.pk)}))

    assert [condominium["name"] for condominium in by_active["results"]] == ["Outro Prédio"]
    assert [condominium["name"] for condominium in by_search["results"]] == ["Residencial Sol"]
    assert [u["name"] for u in by_condominium["results"]] == ["202"]
    assert blocks["count"] == 1


def test_the_list_carries_the_unit_count(client: APIClient, company: Company, condominium: Condominium) -> None:
    """Spec 038, R3: the workspace list shows how many units each condominium has."""
    _ = Condominium.objects.create(company=company, name="Outro Prédio", cnpj="45723174000110")
    for number in range(3):
        _ = Unit.objects.create(condominium=condominium, name=str(number))

    listed = {row["name"]: row["unit_count"] for row in results(client.get(reverse("condominium-list")))}
    detail = body(client.get(reverse("condominium-detail", args=[condominium.pk])))

    assert listed == {"Residencial Sol": 3, "Outro Prédio": 0}
    assert detail["unit_count"] == 3


def test_a_saved_condominium_answers_its_unit_count(client: APIClient, condominium: Condominium) -> None:
    _ = Unit.objects.create(condominium=condominium, name="1")

    response = client.patch(reverse("condominium-detail", args=[condominium.pk]), {"name": "Novo nome"}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["unit_count"] == 1


def test_the_unit_count_costs_no_query_per_row(client: APIClient, company: Company) -> None:
    def add_condominiums(first: int, last: int) -> None:
        for index in range(first, last):
            created = Condominium.objects.create(company=company, name=f"Prédio {index}", cnpj=f"{index:014d}")
            _ = Unit.objects.create(condominium=created, name="1")

    def queries_of_the_list() -> int:
        with CaptureQueriesContext(connection) as captured:
            _ = client.get(reverse("condominium-list"))
        return len(captured)

    add_condominiums(1, 4)
    with_three = queries_of_the_list()
    add_condominiums(4, 11)

    assert queries_of_the_list() == with_three
