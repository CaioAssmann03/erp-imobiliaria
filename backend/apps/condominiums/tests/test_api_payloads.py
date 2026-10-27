"""Payloads no formato exato que o formulário do frontend envia (criação e edição)."""


import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from ..models import Condominium
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
            "condominium_administration_contract.variable_fee.requires_percentage_and_basis"
        ]
        assert not Condominium.objects.exists()
