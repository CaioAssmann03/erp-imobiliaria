"""Sorting the condominium list by a click on a header (spec 037, R1, R3)."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.models import Company

from ..models import Condominium
from .base import results

pytestmark = pytest.mark.django_db

BY_NAME = ["Alfa", "Bravo", "Charlie"]


def make_condominium(company: Company, name: str, code: int, *, active: bool = True) -> Condominium:
    # The CNPJ is unique and not validated on create: the code padded to 14 digits is enough.
    return Condominium.objects.create(
        company=company, name=name, code=code, cnpj=f"{code:014d}", active=active
    )


def listed_names(client: APIClient, **params: str) -> list[str]:
    return [row["name"] for row in results(client.get(reverse("condominium-list"), params))]


@pytest.fixture
def client(api_client: APIClient) -> APIClient:
    return api_client


@pytest.fixture
def portfolio(company: Company) -> None:
    _ = make_condominium(company, "Bravo", 20)
    _ = make_condominium(company, "Alfa", 30, active=False)
    _ = make_condominium(company, "Charlie", 10)


@pytest.mark.usefixtures("portfolio")
@pytest.mark.parametrize(
    ("ordering", "expected"),
    [
        ("", BY_NAME),
        ("code", ["Charlie", "Bravo", "Alfa"]),
        ("-code", ["Alfa", "Bravo", "Charlie"]),
        ("name", BY_NAME),
        ("-name", ["Charlie", "Bravo", "Alfa"]),
        ("active", ["Alfa", "Bravo", "Charlie"]),  # the inactive one first, then by name
        ("-active", ["Bravo", "Charlie", "Alfa"]),  # the active ones first, then by name
    ],
)
def test_orders_by_each_field_in_both_directions(
    client: APIClient, ordering: str, expected: list[str]
) -> None:
    assert listed_names(client, ordering=ordering) == expected


@pytest.mark.usefixtures("portfolio")
@pytest.mark.parametrize("ordering", ["cnpj", "-company", "advisor__name", "nope"])
def test_an_unknown_ordering_is_ignored(client: APIClient, ordering: str) -> None:
    assert listed_names(client, ordering=ordering) == BY_NAME


def test_the_exact_id_match_stays_first(client: APIClient, company: Company) -> None:
    _ = make_condominium(company, "Zeta", 7)
    _ = make_condominium(company, "Alfa 7", 8)
    _ = make_condominium(company, "Bravo 7", 9)

    ascending = listed_names(client, query="7", ordering="name")
    descending = listed_names(client, query="7", ordering="-name")

    assert ascending == ["Zeta", "Alfa 7", "Bravo 7"]
    assert descending == ["Zeta", "Bravo 7", "Alfa 7"]
