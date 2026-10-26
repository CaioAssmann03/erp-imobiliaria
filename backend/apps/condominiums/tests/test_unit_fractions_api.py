"""A unit's fractions travel in its payload as a list that replaces the set (spec 039, R7)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import ApportionmentCriterion, Condominium, Unit, UnitFraction
from .base import body, error_codes

pytestmark = pytest.mark.django_db

list_url = reverse("unit-list")


def detail_url(unit: Unit) -> str:
    return reverse("unit-detail", args=[unit.pk])


@pytest.fixture
def main(condominium: Condominium) -> ApportionmentCriterion:
    return condominium.apportionment_criteria.get(position=1)


@pytest.fixture
def elevator(condominium: Condominium) -> ApportionmentCriterion:
    return ApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)


def payload(condominium: Condominium, name: str, *fractions: tuple[ApportionmentCriterion, str]) -> dict[str, object]:
    return {
        "condominium": str(condominium.pk),
        "name": name,
        "fractions": [{"criterion": str(criterion.pk), "value": value} for criterion, value in fractions],
    }


def values(unit: Unit) -> dict[str, str]:
    return {fraction.criterion.name: str(fraction.value) for fraction in unit.fractions.select_related("criterion")}


def test_a_unit_is_created_with_its_fractions(
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion, elevator: ApportionmentCriterion
) -> None:
    response = api_client.post(list_url, payload(condominium, "101", (main, "0.5"), (elevator, "0.25")), format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert {str(item["criterion"]): item["value"] for item in body(response)["fractions"]} == {
        str(main.pk): "0.50000000",
        str(elevator.pk): "0.25000000",
    }


def test_sending_the_list_replaces_the_set_and_leaving_it_out_keeps_it(
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion, elevator: ApportionmentCriterion
) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    _ = UnitFraction.objects.create(unit=unit, criterion=main, value="0.5")
    _ = UnitFraction.objects.create(unit=unit, criterion=elevator, value="0.2")

    kept = api_client.patch(detail_url(unit), {"name": "102"}, format="json")
    replaced = api_client.patch(detail_url(unit), {"fractions": [{"criterion": str(main.pk), "value": "0.3"}]}, format="json")
    emptied = api_client.patch(detail_url(unit), {"fractions": []}, format="json")

    assert kept.status_code == status.HTTP_200_OK and replaced.status_code == status.HTTP_200_OK
    assert len(body(kept)["fractions"]) == 2
    assert values(Unit.objects.get(pk=unit.pk)) == {} and emptied.status_code == status.HTTP_200_OK
    assert [item["value"] for item in body(replaced)["fractions"]] == ["0.30000000"]


def test_swapping_two_values_is_not_refused_halfway(
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion
) -> None:
    first = Unit.objects.create(condominium=condominium, name="1")
    second = Unit.objects.create(condominium=condominium, name="2")
    _ = UnitFraction.objects.create(unit=first, criterion=main, value="0.6")
    _ = UnitFraction.objects.create(unit=second, criterion=main, value="0.4")

    response = api_client.patch(detail_url(first), {"fractions": [{"criterion": str(main.pk), "value": "0.6"}]}, format="json")
    swapped = api_client.patch(detail_url(second), {"fractions": [{"criterion": str(main.pk), "value": "0.4"}]}, format="json")

    assert response.status_code == swapped.status_code == status.HTTP_200_OK


def test_two_fractions_for_one_criterion_are_refused(
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion
) -> None:
    response = api_client.post(list_url, payload(condominium, "101", (main, "0.5"), (main, "0.2")), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "fractions") == ["unit_fraction.criterion.duplicate"]


def test_a_sum_over_one_is_refused_and_nothing_is_saved(
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion
) -> None:
    other = Unit.objects.create(condominium=condominium, name="1")
    _ = UnitFraction.objects.create(unit=other, criterion=main, value="0.6")

    response = api_client.post(list_url, payload(condominium, "2", (main, "0.5")), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "fractions") == ["unit.ideal_fraction.sum_exceeds_total"]
    assert not Unit.objects.filter(name="2").exists()


def test_a_value_out_of_range_is_refused(api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion) -> None:
    response = api_client.post(list_url, payload(condominium, "101", (main, "1.5")), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "unit.ideal_fraction.out_of_range" in error_codes(response, "fractions.0.value")


def test_a_criterion_of_another_condominium_is_refused(api_client: APIClient, condominium: Condominium) -> None:
    other = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")
    foreign = other.apportionment_criteria.get(position=1)

    response = api_client.post(list_url, payload(condominium, "101", (foreign, "0.5")), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "fractions") == ["unit_fraction.criterion.other_condominium"]


def test_listing_units_does_not_query_per_unit(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium: Condominium, main: ApportionmentCriterion, django_assert_max_num_queries
) -> None:
    for number in range(5):
        unit = Unit.objects.create(condominium=condominium, name=str(number))
        _ = UnitFraction.objects.create(unit=unit, criterion=main, value="0.1")

    with django_assert_max_num_queries(12):
        response = api_client.get(list_url)

    assert response.status_code == status.HTTP_200_OK
