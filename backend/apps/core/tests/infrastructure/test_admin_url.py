"""ADMIN_URL: where the Django Admin lives (spec 008, R5, R6)."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[4]


def run(code: str, **env: str) -> subprocess.CompletedProcess[str]:
    base = {key: value for key, value in os.environ.items() if key not in {"DEBUG", "SECRET_KEY", "ADMIN_URL"}}
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=BACKEND,
        env={**base, "DJANGO_SETTINGS_MODULE": "config.settings", "POSTGRES_DB": "db", **env},
        capture_output=True,
        text=True,
        check=False,
    )


ADMIN_PATHS = """
import django
django.setup()
from django.test import Client
from django.urls import reverse
print(reverse("admin:index"))
print(Client(HTTP_HOST="localhost").get("/admin/").status_code)
"""


def test_admin_is_served_at_admin_url_by_default() -> None:
    completed = run(ADMIN_PATHS)

    assert completed.returncode == 0, completed.stderr
    assert completed.stdout.split() == ["/admin/", "302"]


def test_old_admin_path_is_404_after_change() -> None:
    completed = run(ADMIN_PATHS, ADMIN_URL="gestao-interna/")

    assert completed.returncode == 0, completed.stderr
    assert completed.stdout.split() == ["/gestao-interna/", "404"]


@pytest.mark.parametrize(
    ("raw", "normalized"),
    [("gestao", "gestao/"), ("/gestao/", "gestao/"), ("  gestao//  ", "gestao/"), ("a/b", "a/b/")],
)
def test_admin_url_is_normalized(raw: str, normalized: str) -> None:
    completed = run("import config.settings as s; print(s.ADMIN_URL)", ADMIN_URL=raw)

    assert completed.returncode == 0, completed.stderr
    assert completed.stdout.strip() == normalized


@pytest.mark.parametrize("invalid", ["", "/", "https://evil.example/", "../admin", "a/../b"])
def test_invalid_admin_url_stops_startup(invalid: str) -> None:
    completed = run("import config.settings", ADMIN_URL=invalid)

    assert completed.returncode != 0
    assert "ADMIN_URL must be a relative path" in completed.stderr
