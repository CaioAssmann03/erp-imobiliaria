"""Cost centers: API, rules and scoping (spec 009, R1, R3, R4, R5, R6, R8)."""

import pytest
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.core.tests.scoping_data import build_company_data

from ..models import CostCenter, EntryTemplate
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "cost-center-list"
DETAIL = "cost-center-detail"


# ----- R1: CRUD, filters, search, order -----


def test_crud(api_client: APIClient, condominium: Condominium) -> None:
    created = api_client.post(
        reverse(LIST), {"condominium": str(condominium.pk), "name": "Fundo de Obras"}, format="json"
    )
    assert created.status_code == status.HTTP_201_CREATED, created.data
    cost_center_id = body(created)["id"]
    assert body(created)["active"] is True

    detail = reverse(DETAIL, args=[cost_center_id])
    assert api_client.get(detail).status_code == status.HTTP_200_OK
    renamed = api_client.patch(detail, {"name": "Fundo de Obras 2"}, format="json")
    assert renamed.status_code == status.HTTP_200_OK
    assert body(renamed)["name"] == "Fundo de Obras 2"
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
    assert not CostCenter.objects.filter(pk=cost_center_id).exists()


def test_filters_and_search(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    _ = CostCenter.objects.create(condominium=condominium, name="Água e Esgoto")
    _ = CostCenter.objects.create(condominium=condominium, name="Elevadores", active=False)
    _ = CostCenter.objects.create(condominium=other_condominium, name="Água")

    by_condominium = results(api_client.get(reverse(LIST), {"condominium": str(condominium.pk)}))
    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    searched = results(api_client.get(reverse(LIST), {"query": "água"}))

    assert {item["name"] for item in by_condominium} == {"Água e Esgoto", "Elevadores"}
    assert [item["name"] for item in inactive] == ["Elevadores"]
    assert {item["name"] for item in searched} == {"Água e Esgoto", "Água"}


def test_list_is_paginated_and_ordered(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    _ = CostCenter.objects.create(condominium=condominium, name="B")
    _ = CostCenter.objects.create(condominium=condominium, name="A")
    _ = CostCenter.objects.create(condominium=other_condominium, name="A")

    response = api_client.get(reverse(LIST))

    assert set(body(response)) == {"count", "next", "previous", "results"}
    # condominium name first ("Edifício Lua" < "Residencial Sol"), then the cost center name
    assert [(str(item["condominium"]), item["name"]) for item in results(response)] == [
        (str(other_condominium.pk), "A"),
        (str(condominium.pk), "A"),
        (str(condominium.pk), "B"),
    ]


def test_requires_authentication() -> None:
    assert APIClient().get(reverse(LIST)).status_code == status.HTTP_401_UNAUTHORIZED


def test_ordering_is_declared() -> None:
    assert CostCenter._meta.ordering == ("condominium__name", "name")


# ----- R3: company scoping -----


def test_other_company_is_404_and_foreign_condominium_is_does_not_exist(
    api_client: APIClient, other_company: Company
) -> None:
    theirs = build_company_data(other_company, seed=2)
    their_cost_center = CostCenter.objects.create(condominium=theirs.condominium, name="Alheio")

    detail = api_client.get(reverse(DETAIL, args=[their_cost_center.pk]))
    listed = results(api_client.get(reverse(LIST)))
    created = api_client.post(
        reverse(LIST), {"condominium": str(theirs.condominium.pk), "name": "X"}, format="json"
    )

    assert detail.status_code == status.HTTP_404_NOT_FOUND
    assert listed == []
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]


# ----- R4: unique name -----


def test_duplicate_name_is_a_400_with_its_code(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter
) -> None:
    response = api_client.post(
        reverse(LIST), {"condominium": str(condominium.pk), "name": cost_center.name}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "cost_center.name.duplicate_in_condominium"


def test_same_name_is_allowed_in_another_condominium(
    api_client: APIClient, cost_center: CostCenter, other_condominium: Condominium
) -> None:
    response = api_client.post(
        reverse(LIST),
        {"condominium": str(other_condominium.pk), "name": cost_center.name},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED


# ----- R5: deletion -----


def test_delete_with_entry_templates_is_a_400(
    api_client: APIClient, cost_center: CostCenter
) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="Fundo")

    response = api_client.delete(reverse(DETAIL, args=[cost_center.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0] == {
        "field": None,
        "code": "cost_center.deletion.has_entry_templates",
        "message": "This cost center has entry templates; deactivate it instead.",
    }
    assert CostCenter.objects.filter(pk=cost_center.pk).exists()


def test_delete_without_entry_templates_is_204(
    api_client: APIClient, cost_center: CostCenter
) -> None:
    response = api_client.delete(reverse(DETAIL, args=[cost_center.pk]))

    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_a_cost_center_with_templates_is_deactivated_instead(
    api_client: APIClient, cost_center: CostCenter
) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="Fundo")

    response = api_client.patch(reverse(DETAIL, args=[cost_center.pk]), {"active": False}, format="json")

    assert response.status_code == status.HTTP_200_OK
    cost_center.refresh_from_db()
    assert cost_center.active is False


def test_delete_rule_holds_for_code_that_calls_delete(cost_center: CostCenter) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="Fundo")

    with pytest.raises(ValidationError) as error:
        _ = cost_center.delete()

    assert error.value.code == "cost_center.deletion.has_entry_templates"
    assert CostCenter.objects.filter(pk=cost_center.pk).exists()


def test_the_database_still_protects_a_bulk_delete(cost_center: CostCenter) -> None:
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="Fundo")

    with pytest.raises(ProtectedError):
        _ = CostCenter.objects.filter(pk=cost_center.pk).delete()


# ----- R6: immutable condominium -----


def test_condominium_cannot_change(
    api_client: APIClient, cost_center: CostCenter, other_condominium: Condominium
) -> None:
    response = api_client.patch(
        reverse(DETAIL, args=[cost_center.pk]),
        {"condominium": str(other_condominium.pk)},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "condominium") == ["cost_center.condominium.immutable"]
    cost_center.refresh_from_db()
    assert cost_center.condominium_id != other_condominium.pk


def test_same_condominium_is_accepted(api_client: APIClient, cost_center: CostCenter) -> None:
    response = api_client.patch(
        reverse(DETAIL, args=[cost_center.pk]),
        {"condominium": str(cost_center.condominium_id), "name": "Novo nome"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK


# ----- spec 039: the code of a cost center -----


def test_the_code_is_assigned_in_order_when_left_out(condominium: Condominium, other_condominium: Condominium) -> None:
    first = CostCenter.objects.create(condominium=condominium, name="Conta Normal")
    second = CostCenter.objects.create(condominium=condominium, name="Fundo de Obras")
    elsewhere = CostCenter.objects.create(condominium=other_condominium, name="Conta Normal")

    assert (first.code, second.code, elsewhere.code) == (0, 1, 0)


def test_a_code_is_unique_per_condominium(condominium: Condominium) -> None:
    _ = CostCenter.objects.create(condominium=condominium, code=3, name="Fundo de Reserva")
    duplicate = CostCenter(condominium=condominium, code=3, name="Outra")

    with pytest.raises(ValidationError) as raised:
        duplicate.full_clean()

    assert "already has a cost center with this code" in str(raised.value)


def test_the_api_shows_and_accepts_the_code(api_client: APIClient, condominium: Condominium) -> None:
    created = api_client.post(
        reverse(LIST), {"condominium": str(condominium.pk), "code": 2, "name": "Fundo de Obras"}, format="json"
    )
    auto = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "name": "Garagem"}, format="json")

    assert body(created)["code"] == 2
    assert body(auto)["code"] == 3
