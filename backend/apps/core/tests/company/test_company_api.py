"""/api/companies/: staff sees and edits only their own company (spec 004, R8)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from ..base import results

pytestmark = pytest.mark.django_db

NEW_CNPJ = "45723174000110"


def test_staff_sees_only_own_company(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    listed = results(api_client.get(reverse("company-list")))

    assert [item["id"] for item in listed] == [str(company.pk)]


def test_staff_cannot_read_another_company(api_client: APIClient, other_company: Company) -> None:
    response = api_client.get(reverse("company-detail", args=[other_company.pk]))

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_staff_can_patch_own_company(api_client: APIClient, company: Company) -> None:
    response = api_client.patch(
        reverse("company-detail", args=[company.pk]), {"trade_name": "Nova marca"}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    company.refresh_from_db()
    assert company.trade_name == "Nova marca"


def test_staff_cannot_patch_another_company(api_client: APIClient, other_company: Company) -> None:
    response = api_client.patch(
        reverse("company-detail", args=[other_company.pk]), {"trade_name": "X"}, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_staff_cannot_create_a_company(api_client: APIClient) -> None:
    response = api_client.post(
        reverse("company-list"), {"legal_name": "ACME", "cnpj": NEW_CNPJ}, format="json"
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert not Company.objects.filter(cnpj=NEW_CNPJ).exists()


def test_staff_cannot_delete_a_company(api_client: APIClient, company: Company) -> None:
    response = api_client.delete(reverse("company-detail", args=[company.pk]))

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Company.objects.filter(pk=company.pk).exists()


def test_superuser_creates_and_sees_all(
    superuser_client: APIClient, company: Company, other_company: Company
) -> None:
    created = superuser_client.post(
        reverse("company-list"), {"legal_name": "ACME", "cnpj": NEW_CNPJ}, format="json"
    )
    listed = {item["id"] for item in results(superuser_client.get(reverse("company-list")))}

    assert created.status_code == status.HTTP_201_CREATED
    assert {str(company.pk), str(other_company.pk)} <= listed
