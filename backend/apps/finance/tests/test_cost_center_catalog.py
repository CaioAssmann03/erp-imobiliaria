"""The administradora's catalog of sub-contas (spec 053, R1-R5)."""

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company

from ..models import CostCenter, CostCenterCatalogItem
from .base import body, error_codes, errors, results

pytestmark = pytest.mark.django_db

LIST = "cost-center-catalog-item-list"
DETAIL = "cost-center-catalog-item-detail"
COST_CENTERS = "cost-center-list"


def item(company: Company, name: str, **fields: object) -> CostCenterCatalogItem:
    return CostCenterCatalogItem.objects.create(company=company, name=name, **fields)


# ----- R1: the catalog and its API -----


def test_the_code_is_the_next_free_one_of_the_company(company: Company, other_company: Company) -> None:
    first = item(company, "Conta Normal")
    explicit = item(company, "Fundo de Obras", code=7)
    after = item(company, "Garagem")
    elsewhere = item(other_company, "Conta Normal")

    assert (first.code, explicit.code, after.code, elsewhere.code) == (0, 7, 8, 0)


def test_the_code_and_the_name_are_unique_per_company(company: Company) -> None:
    _ = item(company, "Fundo de Reserva", code=3)

    with pytest.raises(ValidationError) as same_code:
        CostCenterCatalogItem(company=company, name="Outra", code=3).full_clean()
    with pytest.raises(ValidationError) as same_name:
        CostCenterCatalogItem(company=company, name="fundo de reserva", code=4).full_clean()

    assert "already has a sub-conta with this code" in str(same_code.value)
    assert "already has a sub-conta with this name" in str(same_name.value)


def test_crud_through_the_api(api_client: APIClient) -> None:
    created = api_client.post(reverse(LIST), {"name": "Fundo de Reserva"}, format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert body(created)["code"] == 0
    assert body(created)["cost_center_count"] == 0

    detail = reverse(DETAIL, args=[body(created)["id"]])
    renamed = api_client.patch(detail, {"name": "Fundo de Reserva Geral", "code": 5}, format="json")
    assert renamed.status_code == status.HTTP_200_OK
    assert (body(renamed)["name"], body(renamed)["code"]) == ("Fundo de Reserva Geral", 5)
    assert api_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT


def test_filters_and_search(api_client: APIClient, company: Company) -> None:
    _ = item(company, "Água e Esgoto")
    _ = item(company, "Elevadores", active=False)

    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    searched = results(api_client.get(reverse(LIST), {"query": "água"}))

    assert [entry["name"] for entry in inactive] == ["Elevadores"]
    assert [entry["name"] for entry in searched] == ["Água e Esgoto"]


def test_a_duplicate_name_is_a_400_with_its_code(api_client: APIClient, company: Company) -> None:
    _ = item(company, "Garagem")

    response = api_client.post(reverse(LIST), {"name": "GARAGEM"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cost_center_catalog_item.name.duplicate_in_company" in {entry["code"] for entry in errors(response)}


def test_another_company_sees_nothing_and_cannot_read_an_item(
    other_api_client: APIClient, company: Company
) -> None:
    mine = item(company, "Garagem")

    assert results(other_api_client.get(reverse(LIST))) == []
    assert other_api_client.get(reverse(DETAIL, args=[mine.pk])).status_code == status.HTTP_404_NOT_FOUND


# ----- R3: the item reaches its sub-contas -----


def test_renaming_an_item_renames_the_sub_contas_that_use_it(
    company: Company, condominium: Condominium, other_condominium: Condominium
) -> None:
    reserve = item(company, "Fundo de Reserva", code=1)
    first = CostCenter.objects.create(condominium=condominium, catalog_item=reserve)
    second = CostCenter.objects.create(condominium=other_condominium, catalog_item=reserve)

    reserve.name = "Reserva"
    reserve.code = 9
    reserve.save()

    for cost_center in (first, second):
        cost_center.refresh_from_db()
        assert (cost_center.name, cost_center.code) == ("Reserva", 9)


def test_an_item_in_use_cannot_be_deleted(api_client: APIClient, company: Company, condominium: Condominium) -> None:
    used = item(company, "Fundo de Obras")
    _ = CostCenter.objects.create(condominium=condominium, catalog_item=used)

    response = api_client.delete(reverse(DETAIL, args=[used.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["cost_center_catalog_item.deletion.in_use"]
    assert CostCenterCatalogItem.objects.filter(pk=used.pk).exists()


def test_an_inactive_item_cannot_start_a_new_sub_conta_but_existing_ones_stay(
    api_client: APIClient, company: Company, condominium: Condominium, other_condominium: Condominium
) -> None:
    retired = item(company, "Pintura")
    existing = CostCenter.objects.create(condominium=condominium, catalog_item=retired)
    _ = CostCenterCatalogItem.objects.filter(pk=retired.pk).update(active=False)

    response = api_client.post(
        reverse(COST_CENTERS),
        {"condominium": str(other_condominium.pk), "catalog_item": str(retired.pk)},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "catalog_item") == ["cost_center.catalog_item.inactive"]
    assert CostCenter.objects.filter(pk=existing.pk).exists()


# ----- R2 / R4: the sub-conta and its item -----


def test_the_api_needs_a_catalog_item_from_the_same_company(
    api_client: APIClient, condominium: Condominium, other_company: Company
) -> None:
    foreign = item(other_company, "Alheia")

    missing = api_client.post(reverse(COST_CENTERS), {"condominium": str(condominium.pk), "name": "Sozinha"}, format="json")
    other = api_client.post(
        reverse(COST_CENTERS), {"condominium": str(condominium.pk), "catalog_item": str(foreign.pk)}, format="json"
    )

    assert missing.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(missing, "catalog_item") == ["required"]
    assert other.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(other, "catalog_item") == ["does_not_exist"]


def test_the_item_of_a_sub_conta_cannot_change(
    api_client: APIClient, company: Company, cost_center: CostCenter
) -> None:
    another = item(company, "Outra")

    response = api_client.patch(
        reverse("cost-center-detail", args=[cost_center.pk]), {"catalog_item": str(another.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "catalog_item") == ["cost_center.catalog_item.immutable"]


def test_a_condominium_uses_an_item_once(company: Company, condominium: Condominium) -> None:
    used = item(company, "Garagem")
    _ = CostCenter.objects.create(condominium=condominium, catalog_item=used)
    again = CostCenter(condominium=condominium, catalog_item=used)

    with pytest.raises(ValidationError) as raised:
        again.full_clean()

    assert "already uses this sub-conta" in str(raised.value)


# ----- R5: code that only knows a name -----


def test_creating_by_name_finds_or_creates_the_catalog_item(
    condominium: Condominium, other_condominium: Condominium
) -> None:
    first = CostCenter.objects.create(condominium=condominium, name="Fundo de Reserva")
    again = CostCenter.objects.create(condominium=other_condominium, name="fundo de reserva ")

    assert first.catalog_item_id == again.catalog_item_id
    assert again.name == "Fundo de Reserva"  # the item's spelling wins
    assert CostCenterCatalogItem.objects.filter(company=condominium.company).count() == 1


def test_a_given_code_is_kept_when_free_and_replaced_when_taken(condominium: Condominium) -> None:
    free = CostCenter.objects.create(condominium=condominium, code=5, name="Obras")
    taken = CostCenter.objects.create(condominium=condominium, code=5, name="Garagem")

    assert (free.code, taken.code) == (5, 6)


def test_the_list_comes_by_code_even_though_it_counts_the_condominiums(api_client: APIClient, company: Company) -> None:
    """Spec 061: the count groups the query and a grouped query ignores `Meta.ordering`, so the view asks for the code order."""
    for code, name in ((5, "Elevadores"), (0, "Conta Normal"), (9, "Piscina"), (2, "Água")):
        _ = item(company, name, code=code)

    listed = results(api_client.get(reverse(LIST)))

    assert [row["code"] for row in listed] == [0, 2, 5, 9]


def test_unused_by_condominium_leaves_out_the_items_the_condominium_already_has(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    used = item(company, "Fundo de Reserva")
    _ = item(company, "Fundo de Obras")
    _ = CostCenter.objects.create(condominium=condominium, name=used.name, catalog_item=used)

    free = results(api_client.get(reverse(LIST), {"unused_by_condominium": str(condominium.pk)}))
    everything = results(api_client.get(reverse(LIST)))

    assert [row["name"] for row in free] == ["Fundo de Obras"]
    assert len(everything) == 2
