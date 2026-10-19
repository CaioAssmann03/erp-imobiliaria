import os
import subprocess
import sys
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

BACKEND = Path(__file__).resolve().parents[4]


# Test-only key of pytest.ini (spec 022); the helper below drops the inherited one.
JWT_SIGNING_KEY = os.environ["JWT_SIGNING_KEY"]
RSA_PRIVATE_KEY = (
    rsa.generate_private_key(public_exponent=65537, key_size=2048)
    .private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    .decode()
)


def import_settings(**env: str) -> subprocess.CompletedProcess[str]:
    base = {k: v for k, v in os.environ.items() if k not in {"POSTGRES_DB", "SECRET_KEY", "DEBUG", "INTERNAL_API_KEY", "JWT_SIGNING_KEY"}}
    return subprocess.run(
        [sys.executable, "-c", "import config.settings"],
        cwd=BACKEND,
        env={**base, "DJANGO_SETTINGS_MODULE": "config.settings", **env},
        capture_output=True,
        text=True,
        check=False,
    )


def test_postgres_is_mandatory() -> None:
    completed_process = import_settings(SECRET_KEY="x", JWT_SIGNING_KEY=JWT_SIGNING_KEY)

    assert completed_process.returncode != 0
    assert "POSTGRES_DB is not set" in completed_process.stderr


def test_secret_key_is_mandatory_in_production() -> None:
    completed_process = import_settings(DEBUG="false", POSTGRES_DB="db", JWT_SIGNING_KEY=JWT_SIGNING_KEY)

    assert completed_process.returncode != 0
    assert "SECRET_KEY must be set" in completed_process.stderr


def test_development_defaults_boot() -> None:
    completed_process = import_settings(POSTGRES_DB="db", JWT_SIGNING_KEY=JWT_SIGNING_KEY)

    assert completed_process.returncode == 0, completed_process.stderr


def test_internal_api_key_is_required_in_production() -> None:
    completed_process = import_settings(DEBUG="false", POSTGRES_DB="db", SECRET_KEY="x" * 40, JWT_SIGNING_KEY=JWT_SIGNING_KEY)

    assert completed_process.returncode != 0
    assert "INTERNAL_API_KEY must be set" in completed_process.stderr


def test_internal_api_key_in_production_boots() -> None:
    completed_process = import_settings(
        DEBUG="false", POSTGRES_DB="db", SECRET_KEY="x" * 40, INTERNAL_API_KEY="k" * 40, JWT_SIGNING_KEY=JWT_SIGNING_KEY
    )

    assert completed_process.returncode == 0, completed_process.stderr


def test_jwt_signing_key_is_mandatory_even_in_development() -> None:
    completed_process = import_settings(POSTGRES_DB="db")

    assert completed_process.returncode != 0
    assert "JWT_SIGNING_KEY must be set" in completed_process.stderr


def test_jwt_signing_key_must_be_an_ed25519_private_key() -> None:
    not_a_key = import_settings(POSTGRES_DB="db", JWT_SIGNING_KEY="not-a-key")
    rsa_key = import_settings(POSTGRES_DB="db", JWT_SIGNING_KEY=RSA_PRIVATE_KEY)

    assert not_a_key.returncode != 0
    assert "JWT_SIGNING_KEY is not a valid PEM private key" in not_a_key.stderr
    assert rsa_key.returncode != 0
    assert "JWT_SIGNING_KEY must be an Ed25519 private key" in rsa_key.stderr


def test_one_line_jwt_signing_key_boots() -> None:
    assert "\\n" in JWT_SIGNING_KEY  # pytest.ini holds the one-line form
    completed_process = import_settings(POSTGRES_DB="db", JWT_SIGNING_KEY=JWT_SIGNING_KEY)

    assert completed_process.returncode == 0, completed_process.stderr
