import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from ..models import Block, Condominium, Unit

pytestmark = pytest.mark.django_db

LIST_ROUTES = ("condominium-list", "block-list", "unit-list", "unit-person-list")


@pytest.fixture
def client(db: None) -> APIClient:
    from django.contrib.auth import get_user_model

    api = APIClient()
    api.force_authenticate(user=get_user_model().objects.create_user("tester", password="x"))
    return api


@pytest.mark.parametrize("route", LIST_ROUTES)
def test_list_is_paginated(client: APIClient, route: str) -> None:
    response = client.get(reverse(route))

    assert response.status_code == status.HTTP_200_OK
    assert set(response.data) == {"count", "next", "previous", "results"}  # pyright: ignore


@pytest.mark.parametrize("route", LIST_ROUTES)
def test_list_requires_authentication(route: str) -> None:
    assert APIClient().get(reverse(route)).status_code == status.HTTP_401_UNAUTHORIZED


def test_page_size_and_limit(client: APIClient, condominium: Condominium) -> None:
    for number in range(25):
        _ = Unit.objects.create(condominium=condominium, name=str(number))

    default = client.get(reverse("unit-list")).data  # pyright: ignore
    limited = client.get(reverse("unit-list"), {"limit": 5, "page": 2}).data  # pyright: ignore
    capped = client.get(reverse("unit-list"), {"limit": 1000}).data  # pyright: ignore

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

    by_active = client.get(reverse("condominium-list"), {"active": "false"}).data  # pyright: ignore
    by_search = client.get(reverse("condominium-list"), {"query": "sol"}).data  # pyright: ignore
    by_condominium = client.get(reverse("unit-list"), {"condominium": other.pk}).data  # pyright: ignore
    blocks = client.get(reverse("block-list"), {"condominium": condominium.pk}).data  # pyright: ignore

    assert [c["name"] for c in by_active["results"]] == ["Outro Prédio"]
    assert [c["name"] for c in by_search["results"]] == ["Residencial Sol"]
    assert [u["name"] for u in by_condominium["results"]] == ["202"]
    assert blocks["count"] == 1
