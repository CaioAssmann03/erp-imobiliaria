"""JWTs are signed with EdDSA (Ed25519) from JWT_SIGNING_KEY, not HS256 with SECRET_KEY (spec 022)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from ..models import User
from .base import body

pytestmark = pytest.mark.django_db


def test_issued_tokens_are_signed_with_eddsa() -> None:
    _ = User.objects.create_user("maria", password="x")

    response = APIClient().post(
        reverse("token_obtain_pair"),
        {"username": "maria", "password": "x"},
        format="json",
    )

    tokens = body(response)
    for token in (tokens["access"], tokens["refresh"]):
        assert isinstance(token, str)
        assert jwt.get_unverified_header(token)["alg"] == "EdDSA"
        _ = jwt.decode(token, settings.JWT_VERIFYING_KEY, algorithms=["EdDSA"])


def test_hs256_token_signed_with_secret_key_is_rejected() -> None:
    user = User.objects.create_user("maria", password="x")
    now = datetime.now(UTC)
    claims = {
        "token_type": "access",
        "exp": now + timedelta(minutes=5),
        "iat": now,
        "jti": "forged",
        "user_id": str(user.pk),
    }
    forged_token = jwt.encode(claims, str(settings.SECRET_KEY), algorithm="HS256")
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {forged_token}")

    response = client.get(reverse("person-list"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
