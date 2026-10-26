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
    with mock.patch("apps.core.infrastructure.api.middleware.connection") as broken_connection:
        broken_connection.cursor.side_effect = OperationalError("database is down")
        response = Client().get(URL)

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}


def test_health_answers_over_plain_http_with_ssl_redirect_on(settings: Any) -> None:
    settings.SECURE_SSL_REDIRECT = True
    client = Client()

    health = client.get(URL)
    other_path = client.get("/api/persons/")

    assert health.status_code == 200
    assert other_path.status_code == 301
    assert other_path["Location"].startswith("https://")
