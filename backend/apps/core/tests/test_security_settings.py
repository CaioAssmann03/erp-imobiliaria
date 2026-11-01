"""The defaults that keep a forgotten variable from becoming a debug server (spec 065, R2).

`config.settings` reads the environment when it is imported, so each case imports it in a fresh interpreter.
"""

import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[3]
BASE_ENVIRONMENT = {
    "POSTGRES_DB": "erp_imobiliaria",
    "INTERNAL_API_KEY": "internal-key-for-tests-0123456789",
    "GATEWAY_CREDENTIALS_KEY": "5LxWzvItsDUx0RjoF_A4iuAkcPCq5AvSBDjeetppuaA=",
    "JWT_SIGNING_KEY": "-----BEGIN PRIVATE KEY-----\\nMC4CAQAwBQYDK2VwBCIEIPgNc4Fe8BDipzi1QlwfpVP8iIyGPH1Mx9AUw9UaXYvD\\n-----END PRIVATE KEY-----",
}
LONG_SECRET_KEY = "a-long-secret-key-for-the-tests-0123456789"


def settings_in_subprocess(environment: dict[str, str], statement: str) -> subprocess.CompletedProcess[str]:
    """Import the settings with exactly this environment (plus the mandatory keys) and run `statement`."""
    process_environment = {"PATH": os.environ.get("PATH", ""), **BASE_ENVIRONMENT, **environment}
    code = f"from django.conf import settings; import config.settings as _; settings.configure(default_settings=_); {statement}"
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=BACKEND_DIR,
        env=process_environment,
        capture_output=True,
        text=True,
        check=False,
    )


def test_debug_is_off_when_the_variable_is_missing() -> None:
    result = settings_in_subprocess({"SECRET_KEY": LONG_SECRET_KEY}, "print('DEBUG', settings.DEBUG)")

    assert "DEBUG False" in result.stdout, result.stderr


def test_a_missing_secret_key_stops_the_start_when_debug_is_off() -> None:
    result = settings_in_subprocess({}, "print('started')")

    assert "started" not in result.stdout
    assert "SECRET_KEY must be set" in result.stderr


def test_a_short_secret_key_stops_the_start_when_debug_is_off() -> None:
    result = settings_in_subprocess({"SECRET_KEY": "too-short"}, "print('started')")

    assert "started" not in result.stdout
    assert "at least 32 characters" in result.stderr


def test_the_development_secret_key_stops_the_start_when_debug_is_off() -> None:
    result = settings_in_subprocess({"SECRET_KEY": "django-insecure-change-me-in-production"}, "print('started')")

    assert "started" not in result.stdout
    assert "at least 32 characters" in result.stderr


def test_debug_on_starts_without_a_secret_key() -> None:
    result = settings_in_subprocess({"DEBUG": "true"}, "print('DEBUG', settings.DEBUG)")

    assert "DEBUG True" in result.stdout, result.stderr
