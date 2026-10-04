from collections.abc import Callable

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.persons.models import Person


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def list_url() -> str:
    return reverse("person-list")


@pytest.fixture
def detail_url() -> Callable[[Person], str]:
    def _detail_url(person: Person) -> str:
        return reverse("person-detail", args=[person.pk])

    return _detail_url
