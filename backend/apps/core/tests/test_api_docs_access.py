"""The OpenAPI schema and the Swagger page map every endpoint: closed outside development (spec 065, R1)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .test_security_settings import settings_in_subprocess

pytestmark = pytest.mark.django_db

ROUTES = ("schema", "docs")


@pytest.mark.parametrize("route", ROUTES)
def test_the_docs_need_a_token(route: str) -> None:
    assert APIClient().get(reverse(route)).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("route", ROUTES)
def test_the_docs_refuse_a_user_that_is_not_a_superuser(api_client: APIClient, route: str) -> None:
    assert api_client.get(reverse(route)).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.parametrize("route", ROUTES)
def test_a_superuser_reads_the_docs(superuser_client: APIClient, route: str) -> None:
    assert superuser_client.get(reverse(route)).status_code == status.HTTP_200_OK


def test_the_docs_stay_open_in_development() -> None:
    result = settings_in_subprocess(
        {"DEBUG": "true"}, "print(settings.SPECTACULAR_SETTINGS['SERVE_PERMISSIONS'])"
    )

    assert "AllowAny" in result.stdout, result.stderr
