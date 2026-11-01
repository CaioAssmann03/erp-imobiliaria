"""Every authenticated call counts against the user (spec 065, R4)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import UserRateThrottle

pytestmark = pytest.mark.django_db


def test_the_configured_limit_is_600_a_minute() -> None:
    assert UserRateThrottle.THROTTLE_RATES["user"] == "600/min"


def test_a_user_over_the_limit_gets_429(api_client: APIClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(UserRateThrottle.THROTTLE_RATES, "user", "3/min")

    statuses = [api_client.get(reverse("condominium-list")).status_code for _ in range(4)]

    assert statuses == [status.HTTP_200_OK] * 3 + [status.HTTP_429_TOO_MANY_REQUESTS]


def test_the_limit_is_per_user(
    api_client: APIClient, other_api_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setitem(UserRateThrottle.THROTTLE_RATES, "user", "2/min")
    for _ in range(3):
        _ = api_client.get(reverse("condominium-list"))

    assert other_api_client.get(reverse("condominium-list")).status_code == status.HTTP_200_OK
