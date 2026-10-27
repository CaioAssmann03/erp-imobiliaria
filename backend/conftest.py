"""Fixtures shared by every app's tests.

Most tests work inside one company (the one migration `core.0002` creates) with a staff user
that belongs to it; the isolation tests add `other_company` and `other_api_client`.
"""

from typing import Any

import pytest
from apps.accounts.models import User
from apps.core.models import Company
from apps.core.testing import seeded_company
from django.core.cache import cache
from rest_framework.test import APIClient

OTHER_COMPANY_CNPJ = "11222333000181"


@pytest.fixture(autouse=True)
def local_memory_cache(settings: Any) -> None:
    """Tests use a local-memory cache (no Redis needed) and start every test with it empty.

    The rate limit counters live in the cache; that they hold across workers on Redis is
    checked by hand (spec 007, R5).
    """
    settings.CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }
    cache.clear()


@pytest.fixture(autouse=True)
def plain_http_in_tests(settings: Any) -> None:
    """CI runs with DEBUG=false (HTTPS redirect on by default); the test client speaks plain HTTP."""
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture
def company(db: None) -> Company:
    return seeded_company()


@pytest.fixture
def staff_user(company: Company) -> User:
    return User.objects.create_user(username="tester", password="x", company=company)


@pytest.fixture
def api_client(staff_user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def other_company(db: None) -> Company:
    return Company.objects.create(
        legal_name="Outra Administradora", cnpj=OTHER_COMPANY_CNPJ
    )


@pytest.fixture
def other_api_client(other_company: Company) -> APIClient:
    user = User.objects.create_user(
        username="other", password="x", company=other_company
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def superuser_client(company: Company) -> APIClient:
    user = User.objects.create_superuser(username="root", password="x", company=company)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def jwt_api_client(staff_user: User) -> APIClient:
    """A client that really authenticates with a JWT, so the audit trail knows the actor.

    `force_authenticate` skips the authentication class that tells the audit trail who acts.
    """
    from django.urls import reverse

    staff_user.set_password("segredo123")
    staff_user.save()
    tokens = APIClient().post(
        reverse("token_obtain_pair"),
        {"username": staff_user.username, "password": "segredo123"},
        format="json",
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens.data['access']}")
    return client
