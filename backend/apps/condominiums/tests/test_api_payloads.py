"""Payloads no formato exato que o formulário do frontend envia (criação e edição)."""

from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company
from apps.core.models import Company
from apps.persons.models import Person
from apps.persons.services.release_person_to_module import release_person_to_module

from ..models import AdministrationContract, Condominium, Unit, UnitPerson
from .base import body, error_codes

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


@pytest.fixture
def client(api_client: APIClient) -> APIClient:
    return api_client


def create_payload(company: Company, **overrides: object) -> dict[str, object]:
    return {
        "company": str(company.pk),
        "advisor": None,
        "type": "residential",
        "name": "Residencial Sol",
        "cnpj": CNPJ,
        "active": True,
        "address": {"zip_code": "80010000", "street": "Rua A", "city": "Curitiba", "state": "PR"},
        "administration_contract": {
            "fee_type": "fixed",
            "fee_amount": "1850.00",
            "fee_percentage": None,
            "fee_basis": None,
            "charges_iss_on_fee": False,
            "start_date": None,
            "adjustment_base_date": "2025-06-01",
            "adjustment_period_months": 12,
            "adjustment_index": "IGPM",
        },
        **overrides,
    }


class TestCondominiumForm:
    def test_create_with_full_nested_payload(self, client: APIClient, company: Company) -> None:
        response = client.post(
            reverse("condominium-list"), create_payload(company), format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        condominium = Condominium.objects.get(cnpj=CNPJ)
        assert condominium.address is not None
        assert condominium.address.zip_code == "80010000"
        assert condominium.administration_contract.fee_amount == 1850

    def test_create_without_address(self, client: APIClient, company: Company) -> None:
        payload = create_payload(company)
        del payload["address"]

        response = client.post(reverse("condominium-list"), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert Condominium.objects.get(cnpj=CNPJ).address is None

    def test_switch_fee_from_fixed_to_variable(self, client: APIClient, company: Company) -> None:
        created = client.post(reverse("condominium-list"), create_payload(company), format="json")
        url = reverse("condominium-detail", args=[body(created)["id"]])
        contract = {
            "fee_type": "variable",
            "fee_amount": None,
            "fee_percentage": "4.50",
            "fee_basis": "revenue",
            "charges_iss_on_fee": True,
            "start_date": None,
            "adjustment_base_date": None,
            "adjustment_period_months": 12,
            "adjustment_index": "",
        }

        response = client.patch(url, {"administration_contract": contract}, format="json")

        assert response.status_code == status.HTTP_200_OK, response.data
        saved = AdministrationContract.objects.get()
        assert saved.fee_type == "variable"
        assert saved.fee_amount is None
        assert saved.fee_basis == "revenue"
        assert saved.adjustment_base_date is None

    def test_patch_clearing_optional_fields_with_null(
        self, client: APIClient, company: Company
    ) -> None:
        created = client.post(
            reverse("condominium-list"),
            create_payload(company, municipal_registration="123", water_meter="W1"),
            format="json",
        )
        url = reverse("condominium-detail", args=[body(created)["id"]])

        response = client.patch(
            url,
            {
                "municipal_registration": None,
                "water_meter": None,
                "address": {"street": None, "number": None},
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        condominium = Condominium.objects.get()
        assert condominium.municipal_registration is None
        assert condominium.water_meter is None
        assert condominium.address is not None
        assert condominium.address.street is None
        assert condominium.address.city == "Curitiba"

    def test_variable_fee_without_basis_returns_nested_error(
        self, client: APIClient, company: Company
    ) -> None:
        payload = create_payload(company)
        payload["administration_contract"] = {
            "fee_type": "variable",
            "fee_percentage": "5.00",
            "fee_basis": None,
        }

        response = client.post(reverse("condominium-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert error_codes(response, "administration_contract.fee_basis") == [
            "administration_contract.variable_fee.requires_percentage_and_basis"
        ]
        assert not Condominium.objects.exists()


class TestUnitForm:
    @pytest.fixture
    def condominium(self, company: Company) -> Condominium:
        return Condominium.objects.create(company=company, name="A", cnpj=CNPJ)

    def test_create_unit_without_block(self, client: APIClient, condominium: Condominium) -> None:
        payload = {
            "condominium": str(condominium.pk),
            "block": None,
            "name": "101",
            "type": "apartment",
            "registration_number": "",
            "resident_count": 2,
            "is_manager_unit": False,
            "is_billing_blocked": False,
            "active": True,
            "gas_value": "0.00",
            "water_value": "10.50",
            "electricity_value": "0.00",
        }

        response = client.post(reverse("unit-list"), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert Unit.objects.get().water_value == pytest.approx(10.5)

    def test_owner_and_tenant_links(self, client: APIClient, condominium: Condominium) -> None:
        unit = Unit.objects.create(condominium=condominium, name="101")
        person = Person.objects.create(company=seeded_company(), name="Maria")
        release_person_to_module(person, "condominiums")
        owner = {
            "unit": str(unit.pk),
            "person": str(person.pk),
            "role": "owner",
            "start_date": "2024-01-01",
            "end_date": None,
            "ownership_percentage": "100.00",
        }
        tenant = {
            "unit": str(unit.pk),
            "person": str(person.pk),
            "role": "tenant",
            "start_date": "2025-01-01",
            "end_date": "2026-01-01",
            "ownership_percentage": None,
        }

        first = client.post(reverse("unit-person-list"), owner, format="json")
        second = client.post(reverse("unit-person-list"), tenant, format="json")

        assert first.status_code == status.HTTP_201_CREATED, first.data
        assert second.status_code == status.HTTP_201_CREATED, second.data
        detail = body(client.get(reverse("unit-detail", args=[unit.pk])))
        assert {link["role"] for link in detail["unit_people"]} == {"owner", "tenant"}
        assert detail["unit_people"][0]["person_detail"]["name"] == "Maria"

    def test_owner_without_percentage_is_a_400_not_a_500(
        self, client: APIClient, condominium: Condominium
    ) -> None:
        unit = Unit.objects.create(condominium=condominium, name="101")
        person = Person.objects.create(company=seeded_company(), name="Maria")
        release_person_to_module(person, "condominiums")

        response = client.post(
            reverse("unit-person-list"),
            {
                "unit": str(unit.pk),
                "person": str(person.pk),
                "role": "owner",
                "start_date": "2024-01-01",
                "ownership_percentage": None,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not UnitPerson.objects.exists()
