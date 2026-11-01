"""A username that keeps failing is locked for a while, in the API and in the Admin (spec 065, R3)."""

from itertools import count

import pytest
from django.test import Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User

pytestmark = pytest.mark.django_db

PASSWORD = "segredo123"
FAILURE_LIMIT = 10
client_numbers = count(1)


@pytest.fixture(autouse=True)
def user(db: None) -> User:
    return User.objects.create_user("maria", password=PASSWORD)


def api_login(username: str = "maria", password: str = PASSWORD):  # type: ignore[no-untyped-def]
    """Each call comes from another address, so the per-address throttle (5 a minute) does not hide the lockout."""
    return APIClient().post(
        reverse("token_obtain_pair"),
        {"username": username, "password": password},
        format="json",
        REMOTE_ADDR=f"10.1.{next(client_numbers) // 250}.{next(client_numbers) % 250 + 1}",
    )


def fail(times: int, username: str = "maria") -> None:
    for _ in range(times):
        assert api_login(username, "errada").status_code == status.HTTP_401_UNAUTHORIZED


def test_the_username_is_locked_after_ten_failures() -> None:
    fail(FAILURE_LIMIT)

    assert api_login("maria", "errada").status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_a_locked_username_is_refused_even_with_the_right_password() -> None:
    fail(FAILURE_LIMIT)

    assert api_login().status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_nine_failures_do_not_lock() -> None:
    fail(FAILURE_LIMIT - 1)

    assert api_login().status_code == status.HTTP_200_OK


def test_a_successful_login_resets_the_counter() -> None:
    fail(FAILURE_LIMIT - 1)
    assert api_login().status_code == status.HTTP_200_OK

    fail(FAILURE_LIMIT - 1)

    assert api_login().status_code == status.HTTP_200_OK


def test_another_username_is_not_locked() -> None:
    _ = User.objects.create_user("joao", password=PASSWORD)
    fail(FAILURE_LIMIT)

    assert api_login("joao").status_code == status.HTTP_200_OK


def test_the_admin_login_locks_the_same_way(settings: object) -> None:
    admin_login_url = reverse("admin:login")
    client = Client()
    for _ in range(FAILURE_LIMIT):
        _ = client.post(admin_login_url, {"username": "maria", "password": "errada"})

    response = client.post(admin_login_url, {"username": "maria", "password": PASSWORD})

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
