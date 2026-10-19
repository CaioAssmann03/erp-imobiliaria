"""Passwords are hashed with Argon2id; old PBKDF2 hashes still log in and are upgraded (spec 021)."""

import pytest
from django.contrib.auth.hashers import make_password
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from ..models import User

pytestmark = pytest.mark.django_db


def test_new_passwords_are_hashed_with_argon2id() -> None:
    user = User.objects.create_user("maria", password="segredo123")

    assert user.password.startswith("argon2$argon2id$")
    assert user.check_password("segredo123")


def test_pbkdf2_password_logs_in_and_is_rehashed_with_argon2() -> None:
    user = User.objects.create_user("maria")
    user.password = make_password("segredo123", hasher="pbkdf2_sha256")
    user.save(update_fields=["password"])

    response = APIClient().post(
        reverse("token_obtain_pair"),
        {"username": "maria", "password": "segredo123"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    user.refresh_from_db()
    assert user.password.startswith("argon2$argon2id$")
