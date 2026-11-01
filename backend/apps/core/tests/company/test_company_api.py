"""Companies are created and managed only in the Django Admin: the API has no endpoint for them (spec 067, R4)."""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

pytestmark = pytest.mark.django_db


def test_the_api_does_not_expose_companies(superuser_client: APIClient, company: Company) -> None:
    listing = superuser_client.get("/api/companies/")
    detail = superuser_client.get(f"/api/companies/{company.pk}/")
    creation = superuser_client.post("/api/companies/", {"legal_name": "ACME"}, format="json")

    assert [listing.status_code, detail.status_code, creation.status_code] == [status.HTTP_404_NOT_FOUND] * 3

