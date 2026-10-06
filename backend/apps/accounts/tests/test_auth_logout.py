"""POST /api/auth/logout/ revokes the refresh token and is idempotent (spec 007, R2, R10)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User

from .base import error_codes

pytestmark = pytest.mark.django_db

PASSWORD = "segredo123"


@pytest.fixture
def refresh_token(db: None) -> str:
    _ = User.objects.create_user("maria", password=PASSWORD)
    response = APIClient().post(
        reverse("token_obtain_pair"), {"username": "maria", "password": PASSWORD}, format="json"
    )
    return str(response.data["refresh"])


def logout(refresh: object):  # type: ignore[no-untyped-def]
    return APIClient().post(reverse("token_logout"), {"refresh": refresh}, format="json")


def test_logout_blacklists_the_refresh_token(refresh_token: str) -> None:
    response = logout(refresh_token)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    reused = APIClient().post(reverse("token_refresh"), {"refresh": refresh_token}, format="json")
    assert reused.status_code == status.HTTP_401_UNAUTHORIZED


def test_old_refresh_fails_after_logout(refresh_token: str) -> None:
    _ = logout(refresh_token)

    reused = APIClient().post(reverse("token_refresh"), {"refresh": refresh_token}, format="json")

    assert error_codes(reused, None) == ["token_not_valid"]


def test_logout_is_idempotent(refresh_token: str) -> None:
    first = logout(refresh_token)
    second = logout(refresh_token)

    assert first.status_code == second.status_code == status.HTTP_204_NO_CONTENT


def test_logout_with_garbage_or_expired_token_is_204(db: None) -> None:
    garbage = logout("isto-nao-e-um-token")
    empty_like = logout("a.b.c")

    assert garbage.status_code == empty_like.status_code == status.HTTP_204_NO_CONTENT


def test_logout_without_a_refresh_field_is_a_400(db: None) -> None:
    response = APIClient().post(reverse("token_logout"), {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "refresh") == ["required"]
