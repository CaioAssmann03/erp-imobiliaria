"""Names that are unique per parent ignore case: "A" and "a" are the same block, unit or criterion."""

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import Block, Condominium, CondominiumApportionmentCriterion, Unit
from .base import errors

pytestmark = pytest.mark.django_db


def test_a_block_name_that_differs_only_in_case_is_a_400_with_its_code(
    api_client: APIClient, condominium: Condominium
) -> None:
    _ = Block.objects.create(condominium=condominium, name="A")

    response = api_client.post(reverse("block-list"), {"condominium": str(condominium.pk), "name": "a"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert errors(response)[0]["code"] == "block.name.duplicate_in_condominium"


def test_the_same_block_name_is_still_allowed_in_another_condominium(
    api_client: APIClient, condominium: Condominium
) -> None:
    other_condominium = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")
    _ = Block.objects.create(condominium=condominium, name="A")

    response = api_client.post(reverse("block-list"), {"condominium": str(other_condominium.pk), "name": "a"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED


def test_a_unit_name_ignores_case_within_a_block_and_without_one(condominium: Condominium) -> None:
    block = Block.objects.create(condominium=condominium, name="A")
    _ = Unit.objects.create(condominium=condominium, block=block, name="Apto 1")
    _ = Unit.objects.create(condominium=condominium, name="Casa B")

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = Unit.objects.create(condominium=condominium, block=block, name="APTO 1")
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = Unit.objects.create(condominium=condominium, name="casa b")


def test_a_criterion_name_ignores_case(condominium: Condominium) -> None:
    _ = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="Elevador", position=2)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CondominiumApportionmentCriterion.objects.create(condominium=condominium, name="ELEVADOR", position=3)
