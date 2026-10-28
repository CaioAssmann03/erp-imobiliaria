"""A unit's fractions travel in its payload as a list that replaces the set (spec 047, R7)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


from ..models import CondominiumApportionmentCriterion, Condominium, Unit, UnitApportionmentFraction
from .base import body, error_codes

pytestmark = pytest.mark.django_db

list_url = reverse("unit-list")


def detail_url(unit: Unit) -> str:
    return reverse("unit-detail", args=[unit.pk])


@pytest.fixture
def main(condominium: Condominium) -> CondominiumApportionmentCriterion:
    return condominium.apportionment_criteria.get(position=1)


@pytest.fixture
def elevator(condominium: Condominium) -> CondominiumApportionmentCriterion:
    return CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)


def payload(condominium: Condominium, name: str, *fractions: tuple[CondominiumApportionmentCriterion, str]) -> dict[str, object]:
    return {
        "condominium": str(condominium.pk),
        "name": name,
        "fractions": [{"criterion": str(criterion.pk), "value": value} for criterion, value in fractions],
    }


def values(unit: Unit) -> dict[str, str]:
    return {fraction.criterion.name: str(fraction.value) for fraction in unit.fractions.select_related("criterion")}


def test_a_unit_is_created_with_its_fractions(
    api_client: APIClient, condominium: Condominium, main: CondominiumApportionmentCriterion, elevator: CondominiumApportionmentCriterion
) -> None:
    response = api_client.post(list_url, payload(condominium, "101", (main, "0.5"), (elevator, "0.25")), format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert {str(item["criterion"]): item["value"] for item in body(response)["fractions"]} == {
        str(main.pk): "0.50000000",
        str(elevator.pk): "0.25000000",
    }


def test_sending_the_list_replaces_the_set_and_leaving_it_out_keeps_it(
    api_client: APIClient, condominium: Condominium, main: CondominiumApportionmentCriterion, elevator: CondominiumApportionmentCriterion
) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    _ = UnitApportionmentFraction.objects.create(unit=unit, criterion=main, value="0.5")
    _ = UnitApportionmentFraction.objects.create(unit=unit, criterion=elevator, value="0.2")

    kept = api_client.patch(detail_url(unit), {"name": "102"}, format="json")
    replaced = api_client.patch(detail_url(unit), {"fractions": [{"criterion": str(main.pk), "value": "0.3"}]}, format="json")
    emptied = api_client.patch(detail_url(unit), {"fractions": []}, format="json")

    assert kept.status_code == status.HTTP_200_OK and replaced.status_code == status.HTTP_200_OK
    assert len(body(kept)["fractions"]) == 2
    assert values(Unit.objects.get(pk=unit.pk)) == {} and emptied.status_code == status.HTTP_200_OK
    assert [item["value"] for item in body(replaced)["fractions"]] == ["0.30000000"]


def test_swapping_two_values_is_not_refused_halfway(
    api_client: APIClient, condominium: Condominium, main: CondominiumApportionmentCriterion
) -> None:
    first = Unit.objects.create(condominium=condominium, name="1")
    second = Unit.objects.create(condominium=condominium, name="2")
    _ = UnitApportionmentFraction.objects.create(unit=first, criterion=main, value="0.6")
    _ = UnitApportionmentFraction.objects.create(unit=second, criterion=main, value="0.4")

    response = api_client.patch(detail_url(first), {"fractions": [{"criterion": str(main.pk), "value": "0.6"}]}, format="json")
    swapped = api_client.patch(detail_url(second), {"fractions": [{"criterion": str(main.pk), "value": "0.4"}]}, format="json")

    assert response.status_code == swapped.status_code == status.HTTP_200_OK


def test_a_sum_over_one_is_refused_and_nothing_is_saved(
    api_client: APIClient, condominium: Condominium, main: CondominiumApportionmentCriterion
) -> None:
    other = Unit.objects.create(condominium=condominium, name="1")
    _ = UnitApportionmentFraction.objects.create(unit=other, criterion=main, value="0.6")

    response = api_client.post(list_url, payload(condominium, "2", (main, "0.5")), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "fractions") == ["unit.ideal_fraction.sum_exceeds_total"]
    assert not Unit.objects.filter(name="2").exists()
