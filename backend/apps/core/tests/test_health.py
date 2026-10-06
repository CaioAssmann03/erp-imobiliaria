"""GET /api/health/: app + database, nothing else (spec 008, R1, R2)."""

from typing import Any
from unittest import mock

import pytest
from django.db import OperationalError
from django.test import Client

pytestmark = pytest.mark.django_db

URL = "/api/health/"


def test_health_is_ok_when_the_database_answers() -> None:
    response = Client().get(URL)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response["Cache-Control"] == "no-store"


def test_health_is_503_when_the_database_fails() -> None:
    with mock.patch("apps.core.middleware.connection") as broken_connection:
        broken_connection.cursor.side_effect = OperationalError("database is down")
        response = Client().get(URL)

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}


def test_health_body_has_only_status() -> None:
    with mock.patch("apps.core.middleware.connection") as broken_connection:
        broken_connection.cursor.side_effect = OperationalError("password authentication failed for user")
        response = Client().get(URL)

    assert set(response.json()) == {"status"}
    assert "password" not in response.content.decode()


def test_health_handles_get_and_head_only() -> None:
    client = Client()

    assert client.head(URL).status_code == 200
    assert client.post(URL).status_code != 200
    assert client.delete(URL).status_code != 200


def test_health_needs_no_authentication() -> None:
    assert Client().get(URL).status_code == 200  # an anonymous client


def test_health_ignores_allowed_hosts() -> None:
    client = Client()

    health = client.get(URL, HTTP_HOST="10.1.2.3:8000")
    other_path = client.get("/api/persons/", HTTP_HOST="10.1.2.3:8000")

    assert health.status_code == 200
    assert other_path.status_code == 400  # DisallowedHost for everything else


def test_health_answers_over_plain_http_with_ssl_redirect_on(settings: Any) -> None:
    settings.SECURE_SSL_REDIRECT = True
    client = Client()

    health = client.get(URL)
    other_path = client.get("/api/persons/")

    assert health.status_code == 200
    assert other_path.status_code == 301
    assert other_path["Location"].startswith("https://")
