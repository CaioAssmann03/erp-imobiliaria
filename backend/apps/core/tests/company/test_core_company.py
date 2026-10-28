import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company


pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


def test_invalid_cnpj_is_rejected(superuser_client: APIClient) -> None:
    response = superuser_client.post(
        reverse("company-list"),
        {"legal_name": "ACME", "cnpj": "11222333000180"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_cnpj_is_unique(superuser_client: APIClient) -> None:
    _ = Company.objects.create(legal_name="A", cnpj=CNPJ)

    response = superuser_client.post(
        reverse("company-list"), {"legal_name": "B", "cnpj": CNPJ}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_requires_authentication() -> None:
    response = APIClient().get(reverse("company-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
