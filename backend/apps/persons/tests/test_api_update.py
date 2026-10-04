from collections.abc import Callable

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.persons.models import Person

from .base import make_individual

pytestmark = pytest.mark.django_db


def test_patch_updates_person_and_nested(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(name="Antigo", job="A")

    response = api_client.patch(
        detail_url(person),
        {"name": "Novo", "people_individual": {"job": "B"}},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    person.refresh_from_db()
    assert person.name == "Novo"
    assert person.people_individual.job == "B"


def test_patch_same_cpf_does_not_fail(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(cpf="12345678901")

    response = api_client.patch(
        detail_url(person),
        {"people_individual": {"cpf": "12345678901"}},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
