"""Entry templates: API, rules and scoping (spec 009, R2, R3, R4, R6)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.core.tests.scoping_data import build_company_data

from ..models import CostCenter, EntryTemplate
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "entry-template-list"
DETAIL = "entry-template-detail"


@pytest.fixture
def other_cost_center(other_condominium: Condominium) -> CostCenter:
    return CostCenter.objects.create(condominium=other_condominium, name="Água")


def test_crud(api_client: APIClient, cost_center: CostCenter) -> None:
    created = api_client.post(
        reverse(LIST),
        {
            "cost_center": str(cost_center.pk),
            "name": "PG. DMAE",
            "admin_fee_incidence_percentage": "50.00",
            "is_subject_to_social_security": True,
        },
        format="json",
    )
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert body(created)["accumulate_to_balance"] is True
    assert body(created)["admin_fee_incidence_percentage"] == "50.00"

    detail = reverse(DETAIL, args=[body(created)["id"]])
    assert api_client.get(detail).status_code == status.HTTP_200_OK
    patched = api_client.patch(detail, {"name": "PG. CEEE", "active": False}, format="json")
    assert patched.status_code == status.HTTP_200_OK
    assert body(patched)["name"] == "PG. CEEE"
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
    assert not EntryTemplate.objects.exists()


def test_filters_and_search(
    api_client: APIClient, cost_center: CostCenter, other_cost_center: CostCenter
) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="PG. DMAE")
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="PG. CEEE", active=False)
    _ = EntryTemplate.objects.create(cost_center=other_cost_center, name="TAXA DE ADMINISTRAÇÃO")

    by_cost_center = results(api_client.get(reverse(LIST), {"cost_center": str(cost_center.pk)}))
    by_condominium = results(
        api_client.get(reverse(LIST), {"condominium": str(other_cost_center.condominium_id)})
    )
    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    searched = results(api_client.get(reverse(LIST), {"query": "pg"}))

    assert {item["name"] for item in by_cost_center} == {"PG. DMAE", "PG. CEEE"}
    assert [item["name"] for item in by_condominium] == ["TAXA DE ADMINISTRAÇÃO"]
    assert [item["name"] for item in inactive] == ["PG. CEEE"]
    assert {item["name"] for item in searched} == {"PG. DMAE", "PG. CEEE"}


def test_list_is_paginated_and_ordered(
    api_client: APIClient, cost_center: CostCenter, other_cost_center: CostCenter
) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="B")
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="A")
    _ = EntryTemplate.objects.create(cost_center=other_cost_center, name="Z")

    response = api_client.get(reverse(LIST))

    assert set(body(response)) == {"count", "next", "previous", "results"}
    assert [item["name"] for item in results(response)] == ["A", "B", "Z"]  # the first condominium (lowest code) first


def test_ordering_is_declared() -> None:
    assert EntryTemplate._meta.ordering == (
        "cost_center__condominium__code",
        "cost_center__code",
        "name",
    )


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(LIST)).status_code == status.HTTP_401_UNAUTHORIZED


def test_other_company_is_404_and_foreign_cost_center_is_does_not_exist(
    api_client: APIClient, other_company: Company
) -> None:
    theirs = build_company_data(other_company, seed=2)
    their_cost_center = CostCenter.objects.create(condominium=theirs.condominium, name="Alheio")
    their_template = EntryTemplate.objects.create(cost_center=their_cost_center, name="Alheio")

    detail = api_client.get(reverse(DETAIL, args=[their_template.pk]))
    listed = results(api_client.get(reverse(LIST)))
    created = api_client.post(
        reverse(LIST), {"cost_center": str(their_cost_center.pk), "name": "X"}, format="json"
    )

    assert detail.status_code == status.HTTP_404_NOT_FOUND
    assert listed == []
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "cost_center") == ["does_not_exist"]


def test_duplicate_name_is_a_400_with_its_code(
    api_client: APIClient, cost_center: CostCenter
) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="PG. DMAE")

    response = api_client.post(
        reverse(LIST), {"cost_center": str(cost_center.pk), "name": "PG. DMAE"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "entry_template.name.duplicate_in_cost_center"


@pytest.mark.parametrize("percentage", ["-1", "100.01", "250"])
def test_percentage_out_of_range_is_a_400(
    api_client: APIClient, cost_center: CostCenter, percentage: str
) -> None:
    response = api_client.post(
        reverse(LIST),
        {"cost_center": str(cost_center.pk), "name": "X", "admin_fee_incidence_percentage": percentage},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "percentage.out_of_range" in error_codes(response, "admin_fee_incidence_percentage")


def test_cost_center_cannot_change(
    api_client: APIClient, cost_center: CostCenter, other_cost_center: CostCenter
) -> None:
    template = EntryTemplate.objects.create(cost_center=cost_center, name="PG. DMAE")

    response = api_client.patch(
        reverse(DETAIL, args=[template.pk]), {"cost_center": str(other_cost_center.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cost_center") == ["entry_template.cost_center.immutable"]
    template.refresh_from_db()
    assert template.cost_center_id == cost_center.pk


def test_same_cost_center_is_accepted(api_client: APIClient, cost_center: CostCenter) -> None:
    template = EntryTemplate.objects.create(cost_center=cost_center, name="PG. DMAE")

    response = api_client.patch(
        reverse(DETAIL, args=[template.pk]),
        {"cost_center": str(cost_center.pk), "name": "PG. CEEE"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
