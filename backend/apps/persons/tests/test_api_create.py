import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.persons.models import Person

from .base import body, make_individual

pytestmark = pytest.mark.django_db


def test_create_individual(api_client: APIClient, list_url: str) -> None:
    payload = {
        "name": "Maria Silva",
        "people_individual": {"cpf": "12345678901", "job": "Engenheira"},
    }

    response = api_client.post(list_url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    person = Person.objects.get(name="Maria Silva")
    assert person.people_individual.cpf == "12345678901"


def test_create_requires_name(api_client: APIClient, list_url: str) -> None:
    response = api_client.post(list_url, {"email": "a@b.com"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "name" in body(response)


def test_create_duplicate_cpf_is_rejected(
    api_client: APIClient, list_url: str
) -> None:
    _ = make_individual(cpf="12345678901")

    response = api_client.post(
        list_url,
        {"name": "Outra", "people_individual": {"cpf": "12345678901"}},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Person.objects.count() == 1
