"""HTTPS redirect and HSTS (spec 008, R3, R4); the defaults are read from a fresh interpreter."""

import os
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest
from django.test import Client
from django.urls import reverse

BACKEND = Path(__file__).resolve().parents[3]


def setting(name: str, **env: str) -> str:
    """The value of a settings attribute in a fresh process with `env` (no inherited DEBUG/keys)."""
    base = {
        key: value
        for key, value in os.environ.items()
        if key not in {"DEBUG", "SECRET_KEY", "INTERNAL_API_KEY", "SECURE_SSL_REDIRECT", "SECURE_HSTS_SECONDS", "ADMIN_URL"}
    }
    completed = subprocess.run(
        [sys.executable, "-c", f"import config.settings as s; print(repr(s.{name}))"],
        cwd=BACKEND,
        env={**base, "DJANGO_SETTINGS_MODULE": "config.settings", "POSTGRES_DB": "db", **env},
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    return completed.stdout.strip()


PRODUCTION = {"DEBUG": "false", "SECRET_KEY": "x" * 40, "INTERNAL_API_KEY": "k" * 40}


# ----- R3: the redirect -----


def test_ssl_redirect_defaults_on_in_production_and_off_in_development() -> None:
    assert setting("SECURE_SSL_REDIRECT", **PRODUCTION) == "True"
    assert setting("SECURE_SSL_REDIRECT") == "False"


def test_ssl_redirect_can_be_turned_off_by_env() -> None:
    assert setting("SECURE_SSL_REDIRECT", SECURE_SSL_REDIRECT="false", **PRODUCTION) == "False"


@pytest.mark.django_db
def test_http_request_is_redirected_when_ssl_redirect_is_on(settings: Any) -> None:
    settings.SECURE_SSL_REDIRECT = True

    response = Client().get(reverse("person-list"))

    assert response.status_code == 301
    assert response["Location"].startswith("https://")


@pytest.mark.django_db
def test_https_request_is_not_redirected(settings: Any) -> None:
    settings.SECURE_SSL_REDIRECT = True

    response = Client().get(reverse("person-list"), secure=True)

    assert response.status_code == 401  # reached the API (not authenticated)


# ----- R4: HSTS -----


@pytest.mark.django_db
def test_hsts_header_on_https_responses(settings: Any) -> None:
    settings.SECURE_HSTS_SECONDS = 3600

    response = Client().get(reverse("person-list"), secure=True)

    assert response["Strict-Transport-Security"] == "max-age=3600"


def test_hsts_defaults_and_no_subdomains_or_preload() -> None:
    assert setting("SECURE_HSTS_SECONDS", **PRODUCTION) == "3600"
    assert setting("SECURE_HSTS_INCLUDE_SUBDOMAINS", **PRODUCTION) == "False"
    assert setting("SECURE_HSTS_PRELOAD", **PRODUCTION) == "False"


def test_hsts_can_be_raised_by_env() -> None:
    assert setting("SECURE_HSTS_SECONDS", SECURE_HSTS_SECONDS="31536000", **PRODUCTION) == "31536000"


@pytest.mark.django_db
def test_no_hsts_in_development() -> None:
    assert setting("SECURE_HSTS_SECONDS") == "0"
    response = Client().get(reverse("person-list"), secure=True)

    assert "Strict-Transport-Security" not in response
