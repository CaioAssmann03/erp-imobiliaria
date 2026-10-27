"""The apportionment criteria of a condominium: a main one always, named by the condominium, unique name and position (spec 047)."""

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import CondominiumApportionmentCriterion, Condominium, Unit, UnitApportionmentFraction
from .base import error_codes

pytestmark = pytest.mark.django_db

list_url = reverse("condominium-apportionment-criterion-list")


def detail_url(criterion: CondominiumApportionmentCriterion) -> str:
    return reverse("condominium-apportionment-criterion-detail", args=[criterion.pk])


def test_a_new_condominium_has_the_main_criterion(condominium: Condominium) -> None:
    criteria = list(condominium.apportionment_criteria.all())

    assert [(criterion.name, criterion.position, criterion.is_main) for criterion in criteria] == [("Geral", 1, True)]


def test_name_and_position_are_unique_per_condominium(condominium: Condominium) -> None:
    other = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")

    _ = CondominiumApportionmentCriterion.objects.create(condominium=other, name="Geral 2", position=2)  # other condominiums may repeat
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Geral", position=2)
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=1)


def test_the_main_criterion_cannot_be_deleted(api_client: APIClient, condominium: Condominium) -> None:
    main = condominium.apportionment_criteria.get(position=1)

    response = api_client.delete(detail_url(main))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["condominium_apportionment_criterion.deletion.is_main"]


def test_a_criterion_in_use_cannot_be_deleted_and_an_unused_one_can(
    api_client: APIClient, condominium: Condominium
) -> None:
    used = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)
    unused = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Água", position=3)
    _ = UnitApportionmentFraction.objects.create(unit=Unit.objects.create(condominium=condominium, name="1"), criterion=used, value="0.5")

    refused = api_client.delete(detail_url(used))
    deleted = api_client.delete(detail_url(unused))

    assert refused.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(refused, None) == ["condominium_apportionment_criterion.deletion.in_use"]
    assert deleted.status_code == status.HTTP_204_NO_CONTENT
