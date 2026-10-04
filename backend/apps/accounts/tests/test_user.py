import uuid

import pytest
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from ..models import User
from .base import JsonObject, body

pytestmark = pytest.mark.django_db


def test_project_uses_the_accounts_user() -> None:
    assert get_user_model() is User


def test_user_has_uuid_primary_key() -> None:
    user = User.objects.create_user("maria", password="x")

    assert isinstance(user.pk, uuid.UUID)
    assert str(user) == "maria"


def test_password_is_hashed() -> None:
    user = User.objects.create_user("maria", password="segredo123")

    assert user.password != "segredo123"
    assert user.check_password("segredo123")


def test_create_superuser_has_admin_flags() -> None:
    admin = User.objects.create_superuser("root", password="x")

    assert admin.is_staff
    assert admin.is_superuser


def test_username_is_unique() -> None:
    _ = User.objects.create_user("maria", password="x")

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = User.objects.create_user("maria", password="y")


class TestJwtLogin:
    def login(self, username: str, password: str) -> tuple[int, JsonObject]:
        response = APIClient().post(
            reverse("token_obtain_pair"),
            {"username": username, "password": password},
            format="json",
        )
        return response.status_code, body(response)

    def test_valid_credentials_return_tokens(self) -> None:
        _ = User.objects.create_user("maria", password="x")

        code, data = self.login("maria", "x")

        assert code == status.HTTP_200_OK
        assert {"access", "refresh"} <= set(data)

    def test_wrong_password_is_rejected(self) -> None:
        _ = User.objects.create_user("maria", password="x")

        code, _data = self.login("maria", "errada")

        assert code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_user_cannot_login(self) -> None:
        _ = User.objects.create_user("maria", password="x", is_active=False)

        code, _data = self.login("maria", "x")

        assert code == status.HTTP_401_UNAUTHORIZED

    def test_access_token_opens_protected_endpoint(self) -> None:
        _ = User.objects.create_user("maria", password="x")
        _code, data = self.login("maria", "x")
        client = APIClient()

        assert client.get(reverse("person-list")).status_code == 401
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")

        assert client.get(reverse("person-list")).status_code == status.HTTP_200_OK

    def test_refresh_token_issues_new_access(self) -> None:
        _ = User.objects.create_user("maria", password="x")
        _code, data = self.login("maria", "x")

        response = APIClient().post(
            reverse("token_refresh"), {"refresh": data["refresh"]}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access" in body(response)


class TestAdminLogin:
    def test_staff_can_log_into_admin(self, client: Client) -> None:
        _ = User.objects.create_superuser("root", password="x")

        assert client.login(username="root", password="x")
        assert client.get("/admin/").status_code == status.HTTP_200_OK

    def test_user_admin_and_group_admin_pages_load(self, client: Client) -> None:
        _ = User.objects.create_superuser("root", password="x")
        _ = client.login(username="root", password="x")

        assert client.get("/admin/accounts/user/").status_code == status.HTTP_200_OK
        assert client.get("/admin/auth/group/").status_code == status.HTTP_200_OK
        assert client.get("/admin/accounts/user/add/").status_code == status.HTTP_200_OK
