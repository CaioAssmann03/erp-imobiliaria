"""Refresh tokens are revoked after use and after logout (spec 007, R1)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User

from .base import error_codes

pytestmark = pytest.mark.django_db

PASSWORD = "segredo123"


@pytest.fixture
def tokens(db: None) -> dict[str, str]:
    _ = User.objects.create_user("maria", password=PASSWORD)
    response = APIClient().post(
        reverse("token_obtain_pair"), {"username": "maria", "password": PASSWORD}, format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    return {"access": response.data["access"], "refresh": response.data["refresh"]}


def refresh(refresh_token: str):  # type: ignore[no-untyped-def]
    return APIClient().post(reverse("token_refresh"), {"refresh": refresh_token}, format="json")


def test_rotated_refresh_token_cannot_be_reused(tokens: dict[str, str]) -> None:
    first = refresh(tokens["refresh"])
    reused = refresh(tokens["refresh"])

    assert first.status_code == status.HTTP_200_OK
    assert first.data["refresh"] != tokens["refresh"]
    assert reused.status_code == status.HTTP_401_UNAUTHORIZED


def test_blacklisted_refresh_is_rejected_with_token_not_valid(tokens: dict[str, str]) -> None:
    _ = refresh(tokens["refresh"])

    reused = refresh(tokens["refresh"])

    assert error_codes(reused, None) == ["token_not_valid"]


def test_the_rotated_refresh_token_still_works(tokens: dict[str, str]) -> None:
    first = refresh(tokens["refresh"])

    second = refresh(first.data["refresh"])

    assert second.status_code == status.HTTP_200_OK
