"""Login, refresh and logout are rate limited per client (spec 007, R3)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User

from .base import error_codes

pytestmark = pytest.mark.django_db

PASSWORD = "segredo123"


@pytest.fixture(autouse=True)
def user(db: None) -> User:
    return User.objects.create_user("maria", password=PASSWORD)


def login(client: APIClient, password: str = PASSWORD):  # type: ignore[no-untyped-def]
    return client.post(
        reverse("token_obtain_pair"), {"username": "maria", "password": password}, format="json"
    )


def test_sixth_login_in_a_minute_is_429_with_throttled_code() -> None:
    client = APIClient()

    statuses = [login(client, "errada").status_code for _ in range(5)]
    sixth = login(client, "errada")

    assert statuses == [status.HTTP_401_UNAUTHORIZED] * 5
    assert sixth.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert error_codes(sixth, None) == ["throttled"]


def test_the_limit_also_stops_a_correct_password() -> None:
    client = APIClient()
    for _ in range(5):
        _ = login(client, "errada")

    assert login(client).status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_refresh_allows_30_per_minute() -> None:
    tokens = login(APIClient()).data
    client = APIClient()
    refresh_token = tokens["refresh"]

    for _ in range(30):
        response = client.post(reverse("token_refresh"), {"refresh": refresh_token}, format="json")
        assert response.status_code == status.HTTP_200_OK
        refresh_token = response.data["refresh"]
    thirty_first = client.post(reverse("token_refresh"), {"refresh": refresh_token}, format="json")

    assert thirty_first.status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_logout_scope_is_separate_from_login() -> None:
    client = APIClient()
    for _ in range(6):
        _ = login(client, "errada")

    response = client.post(reverse("token_logout"), {"refresh": "x"}, format="json")

    assert response.status_code == status.HTTP_204_NO_CONTENT
