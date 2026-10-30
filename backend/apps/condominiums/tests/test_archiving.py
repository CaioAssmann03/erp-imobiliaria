"""Spec 062: archiving condominiums, blocks and units (R1–R5)."""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.persons.models import Person

from ..models import Block, Condominium, Unit, UnitPerson
from .base import error_codes, results

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


@pytest.fixture
def inactive_condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Residencial Sol", cnpj=CNPJ, active=False)


def delete_url(basename: str, instance: Condominium | Block | Unit) -> str:
    return reverse(f"{basename}-detail", args=[instance.pk])


# ----- R3: the guards -----


def test_an_active_condominium_cannot_be_deleted(api_client: APIClient, condominium: Condominium) -> None:
    response = api_client.delete(delete_url("condominium", condominium))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["condominium.archive.still_active"]
    assert Condominium.objects.filter(pk=condominium.pk).exists()


def test_a_condominium_is_deleted_only_after_its_units_and_blocks(
    api_client: APIClient, inactive_condominium: Condominium
) -> None:
    block = Block.objects.create(condominium=inactive_condominium, name="Bloco A")
    unit = Unit.objects.create(condominium=inactive_condominium, block=block, name="101")

    first = api_client.delete(delete_url("condominium", inactive_condominium))
    assert error_codes(first, None) == ["condominium.archive.has_units"]

    assert api_client.delete(delete_url("unit", unit)).status_code == status.HTTP_204_NO_CONTENT
    second = api_client.delete(delete_url("condominium", inactive_condominium))
    assert error_codes(second, None) == ["condominium.archive.has_blocks"]

    assert api_client.delete(delete_url("block", block)).status_code == status.HTTP_204_NO_CONTENT
    third = api_client.delete(delete_url("condominium", inactive_condominium))
    assert third.status_code == status.HTTP_204_NO_CONTENT


def test_a_block_with_units_cannot_be_deleted(api_client: APIClient, inactive_condominium: Condominium) -> None:
    block = Block.objects.create(condominium=inactive_condominium, name="Bloco A")
    _ = Unit.objects.create(condominium=inactive_condominium, block=block, name="101")

    response = api_client.delete(delete_url("block", block))

    assert error_codes(response, None) == ["block.archive.has_units"]


def make_person(company: Company) -> Person:
    return Person.objects.create(company=company, name="Maria")


def test_a_unit_with_a_current_owner_cannot_be_deleted(
    api_client: APIClient, company: Company, inactive_condominium: Condominium
) -> None:
    unit = Unit.objects.create(condominium=inactive_condominium, name="101")
    _ = UnitPerson.objects.create(
        unit=unit,
        person=make_person(company),
        role=UnitPerson.Role.OWNER,
        ownership_percentage=100,
        start_date=date(2020, 1, 1),
    )

    response = api_client.delete(delete_url("unit", unit))

    assert error_codes(response, None) == ["unit.archive.has_current_people"]


def test_a_unit_whose_links_ended_can_be_deleted(
    api_client: APIClient, company: Company, inactive_condominium: Condominium
) -> None:
    unit = Unit.objects.create(condominium=inactive_condominium, name="101")
    _ = UnitPerson.objects.create(
        unit=unit,
        person=make_person(company),
        role=UnitPerson.Role.TENANT,
        start_date=date(2020, 1, 1),
        end_date=timezone.localdate() - timedelta(days=1),
    )

    response = api_client.delete(delete_url("unit", unit))

    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_a_person_who_is_the_advisor_of_a_condominium_cannot_be_deleted(
    api_client: APIClient, company: Company, inactive_condominium: Condominium
) -> None:
    advisor = make_person(company)
    inactive_condominium.advisor = advisor
    inactive_condominium.save()

    response = api_client.delete(reverse("person-detail", args=[advisor.pk]))

    assert error_codes(response, None) == ["person.archive.is_advisor"]


# ----- R1/R2: archived records leave the API -----


def test_a_deleted_unit_leaves_the_list_and_the_detail(api_client: APIClient, condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")

    assert api_client.delete(delete_url("unit", unit)).status_code == status.HTTP_204_NO_CONTENT

    assert Unit.all_objects.get(pk=unit.pk).is_archived
    assert results(api_client.get(reverse("unit-list"))) == []
    assert api_client.get(delete_url("unit", unit)).status_code == status.HTTP_404_NOT_FOUND
    assert api_client.delete(delete_url("unit", unit)).status_code == status.HTTP_404_NOT_FOUND


# ----- R4: names are reusable, the CNPJ is not -----


def test_a_unit_name_can_be_reused_after_the_unit_is_deleted(condominium: Condominium) -> None:
    first = Unit.objects.create(condominium=condominium, name="101")
    _ = first.delete()

    second = Unit.objects.create(condominium=condominium, name="101")

    assert Unit.objects.get(name="101") == second


def test_a_block_name_can_be_reused_after_the_block_is_deleted(condominium: Condominium) -> None:
    first = Block.objects.create(condominium=condominium, name="Bloco A")
    _ = first.delete()

    _ = Block.objects.create(condominium=condominium, name="Bloco A")

    assert Block.objects.filter(name="Bloco A").count() == 1


def test_registering_the_cnpj_of_a_deleted_condominium_is_refused(
    api_client: APIClient, company: Company, inactive_condominium: Condominium
) -> None:
    _ = inactive_condominium.delete()

    response = api_client.post(
        reverse("condominium-list"),
        {"name": "Residencial Sol II", "cnpj": CNPJ},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cnpj") == ["condominium.cnpj.archived"]
