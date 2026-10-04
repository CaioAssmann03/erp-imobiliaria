import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from .base import results

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


def test_create_company(api_client: APIClient) -> None:
    response = api_client.post(
        reverse("company-list"), {"legal_name": "ACME", "cnpj": CNPJ}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Company.objects.get(cnpj=CNPJ).legal_name == "ACME"


def test_invalid_cnpj_is_rejected(api_client: APIClient) -> None:
    response = api_client.post(
        reverse("company-list"),
        {"legal_name": "ACME", "cnpj": "11222333000180"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_cnpj_is_unique(api_client: APIClient) -> None:
    _ = Company.objects.create(legal_name="A", cnpj=CNPJ)

    response = api_client.post(
        reverse("company-list"), {"legal_name": "B", "cnpj": CNPJ}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_search_by_trade_name(api_client: APIClient) -> None:
    _ = Company.objects.create(legal_name="Alpha LTDA", trade_name="Alpha", cnpj=CNPJ)
    _ = Company.objects.create(legal_name="Beta LTDA", cnpj="45723174000110")

    response = api_client.get(reverse("company-list"), {"query": "alpha"})

    assert [c["legal_name"] for c in results(response)] == ["Alpha LTDA"]


def test_str_prefers_trade_name() -> None:
    assert str(Company(legal_name="Legal", trade_name="Trade")) == "Trade"
    assert str(Company(legal_name="Legal")) == "Legal"


def test_requires_authentication() -> None:
    response = APIClient().get(reverse("company-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
