"""The apportionment criteria of a condominium: a main one always, named by the condominium, unique name and position (spec 039)."""

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import ApportionmentCriterion, Condominium, Unit, UnitFraction
from .base import body, error_codes, results

pytestmark = pytest.mark.django_db

list_url = reverse("apportionment-criterion-list")


def detail_url(criterion: ApportionmentCriterion) -> str:
    return reverse("apportionment-criterion-detail", args=[criterion.pk])


def test_a_new_condominium_has_the_main_criterion(condominium: Condominium) -> None:
    criteria = list(condominium.apportionment_criteria.all())

    assert [(criterion.name, criterion.position, criterion.is_main) for criterion in criteria] == [("Geral", 1, True)]


def test_name_and_position_are_unique_per_condominium(condominium: Condominium) -> None:
    other = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")

    _ = ApportionmentCriterion.objects.create(condominium=other, name="Geral 2", position=2)  # other condominiums may repeat
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = ApportionmentCriterion.objects.create(condominium=condominium, name="Geral", position=2)
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = ApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=1)


def test_the_api_gives_a_new_criterion_the_next_free_position(api_client: APIClient, condominium: Condominium) -> None:
    first = api_client.post(list_url, {"condominium": str(condominium.pk), "name": "Elevador"}, format="json")
    second = api_client.post(list_url, {"condominium": str(condominium.pk), "name": "Água"}, format="json")

    assert first.status_code == status.HTTP_201_CREATED, first.data
    assert (body(first)["position"], body(second)["position"]) == (2, 3)


def test_the_api_refuses_a_repeated_name(api_client: APIClient, condominium: Condominium) -> None:
    response = api_client.post(list_url, {"condominium": str(condominium.pk), "name": "Geral"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "apportionment_criterion.name.duplicate" in [code for code in error_codes(response, None) + error_codes(response, "name")]


def test_a_criterion_is_renamed_but_keeps_its_position_and_condominium(
    api_client: APIClient, condominium: Condominium
) -> None:
    elevator = ApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)

    response = api_client.patch(detail_url(elevator), {"name": "Elevadores", "position": 9}, format="json")

    assert response.status_code == status.HTTP_200_OK, response.data
    elevator.refresh_from_db()
    assert (elevator.name, elevator.position) == ("Elevadores", 2)


def test_the_main_criterion_cannot_be_deleted(api_client: APIClient, condominium: Condominium) -> None:
    main = condominium.apportionment_criteria.get(position=1)

    response = api_client.delete(detail_url(main))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["apportionment_criterion.deletion.is_main"]


def test_a_criterion_in_use_cannot_be_deleted_and_an_unused_one_can(
    api_client: APIClient, condominium: Condominium
) -> None:
    used = ApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)
    unused = ApportionmentCriterion.objects.create(condominium=condominium, name="Água", position=3)
    _ = UnitFraction.objects.create(unit=Unit.objects.create(condominium=condominium, name="1"), criterion=used, value="0.5")

    refused = api_client.delete(detail_url(used))
    deleted = api_client.delete(detail_url(unused))

    assert refused.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(refused, None) == ["apportionment_criterion.deletion.in_use"]
    assert deleted.status_code == status.HTTP_204_NO_CONTENT


def test_the_list_filters_by_condominium_and_is_company_scoped(
    api_client: APIClient, other_api_client: APIClient, condominium: Condominium
) -> None:
    other = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")

    mine = results(api_client.get(list_url, {"condominium": str(condominium.pk)}))
    foreign = results(other_api_client.get(list_url))

    assert [item["name"] for item in mine] == ["Geral"]
    assert foreign == []
    assert other.apportionment_criteria.count() == 1
