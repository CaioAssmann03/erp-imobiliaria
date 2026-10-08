"""The throttle key is the real client address, trusted only with the shared secret (spec 007, R4)."""

import hmac
import logging
from typing import Any

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

KEY = "chave-interna-de-teste"


def login(client: APIClient, **headers: str):  # type: ignore[no-untyped-def]
    extra: dict[str, Any] = dict(headers)
    return client.post(
        reverse("token_obtain_pair"),
        {"username": "x", "password": "errada"},
        format="json",
        **extra,
    )


def as_proxy(client_ip: str, key: str = KEY) -> dict[str, str]:
    return {"HTTP_X_FORWARDED_FOR": client_ip, "HTTP_X_INTERNAL_KEY": key}


def test_forwarded_ip_is_used_only_with_the_internal_key(settings: Any) -> None:
    settings.INTERNAL_API_KEY = KEY
    client = APIClient()
    for _ in range(5):
        _ = login(client, **as_proxy("10.0.0.1"))

    same_client = login(client, **as_proxy("10.0.0.1"))
    other_client = login(client, **as_proxy("10.0.0.2"))

    assert same_client.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert other_client.status_code == status.HTTP_401_UNAUTHORIZED


def test_wrong_key_falls_back_to_remote_addr(settings: Any) -> None:
    settings.INTERNAL_API_KEY = KEY
    client = APIClient()

    for index in range(5):
        _ = login(client, **as_proxy(f"10.0.0.{index}", key="chave-errada"))
    sixth = login(client, **as_proxy("10.0.0.99", key="chave-errada"))

    assert sixth.status_code == status.HTTP_429_TOO_MANY_REQUESTS  # all counted as 127.0.0.1


def test_no_key_configured_ignores_the_forwarded_header(settings: Any) -> None:
    settings.INTERNAL_API_KEY = ""
    client = APIClient()

    for index in range(5):
        _ = login(client, **as_proxy(f"10.0.0.{index}", key=""))
    sixth = login(client, **as_proxy("10.0.0.99", key=""))

    assert sixth.status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_comparison_is_constant_time(settings: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    settings.INTERNAL_API_KEY = KEY
    calls: list[tuple[bytes, bytes]] = []
    real_compare = hmac.compare_digest

    def spy(first: bytes, second: bytes) -> bool:
        calls.append((first, second))
        return real_compare(first, second)

    monkeypatch.setattr("apps.core.api.throttling.hmac.compare_digest", spy)

    _ = login(APIClient(), **as_proxy("10.0.0.1"))

    assert calls == [(KEY.encode(), KEY.encode())]


def test_a_cache_failure_lets_the_request_through(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    def broken(self: Any, request: Any, view: Any) -> bool:
        raise ConnectionError("redis is down")

    monkeypatch.setattr("rest_framework.throttling.ScopedRateThrottle.allow_request", broken)

    with caplog.at_level(logging.ERROR):
        response = login(APIClient())

    assert response.status_code == status.HTTP_401_UNAUTHORIZED  # reached the view: not throttled, not a 500
    assert "Rate limit unavailable" in caplog.text
