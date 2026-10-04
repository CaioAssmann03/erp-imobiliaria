from collections.abc import Callable

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from ..models import Person


@pytest.fixture
def api_client(db: None) -> APIClient:
    client = APIClient()
    user = get_user_model().objects.create_user(username="tester", password="x")
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def list_url() -> str:
    return reverse("person-list")


@pytest.fixture
def detail_url() -> Callable[[Person], str]:
    def _detail_url(person: Person) -> str:
        return reverse("person-detail", args=[person.pk])

    return _detail_url
