import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[4]


def import_settings(**env: str) -> subprocess.CompletedProcess[str]:
    base = {k: v for k, v in os.environ.items() if k not in {"POSTGRES_DB", "SECRET_KEY", "DEBUG"}}
    return subprocess.run(
        [sys.executable, "-c", "import config.settings"],
        cwd=BACKEND,
        env={**base, "DJANGO_SETTINGS_MODULE": "config.settings", **env},
        capture_output=True,
        text=True,
        check=False,
    )


def test_postgres_is_mandatory() -> None:
    completed_process = import_settings(SECRET_KEY="x")

    assert completed_process.returncode != 0
    assert "POSTGRES_DB is not set" in completed_process.stderr


def test_secret_key_is_mandatory_in_production() -> None:
    completed_process = import_settings(DEBUG="false", POSTGRES_DB="db")

    assert completed_process.returncode != 0
    assert "SECRET_KEY must be set" in completed_process.stderr


def test_development_defaults_boot() -> None:
    completed_process = import_settings(POSTGRES_DB="db")

    assert completed_process.returncode == 0, completed_process.stderr


def test_internal_api_key_is_required_in_production() -> None:
    completed_process = import_settings(DEBUG="false", POSTGRES_DB="db", SECRET_KEY="x" * 40)

    assert completed_process.returncode != 0
    assert "INTERNAL_API_KEY must be set" in completed_process.stderr


def test_internal_api_key_in_production_boots() -> None:
    completed_process = import_settings(
        DEBUG="false", POSTGRES_DB="db", SECRET_KEY="x" * 40, INTERNAL_API_KEY="k" * 40
    )

    assert completed_process.returncode == 0, completed_process.stderr
