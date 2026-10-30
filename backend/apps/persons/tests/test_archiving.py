"""Spec 062: archiving, restoring and anonymizing persons (R1, R2, R5–R7)."""

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Company

from ..models import PeopleIndividual, Person
from .base import CPF_A, body, error_codes, make_individual, results

pytestmark = pytest.mark.django_db

LIST = "person-list"
DETAIL = "person-detail"
RESTORE = "person-restore"
ANONYMIZE = "person-anonymize"


@pytest.fixture
def superuser_client(company: Company) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=User.objects.create_superuser("root", password="x", company=company))
    return client


def archive(person: Person, years_ago: int = 0) -> Person:
    _ = person.delete()
    if years_ago:
        Person.all_objects.filter(pk=person.pk).update(deleted_at=timezone.now() - timedelta(days=365 * years_ago + 5))
    return Person.all_objects.get(pk=person.pk)


def test_a_deleted_person_leaves_the_list_and_the_detail(api_client: APIClient) -> None:
    person = make_individual()

    assert api_client.delete(reverse(DETAIL, args=[person.pk])).status_code == status.HTTP_204_NO_CONTENT

    assert Person.all_objects.get(pk=person.pk).is_archived
    assert PeopleIndividual.objects.filter(person=person).exists()  # the documents stay with the row
    assert results(api_client.get(reverse(LIST))) == []
    assert api_client.get(reverse(DETAIL, args=[person.pk])).status_code == status.HTTP_404_NOT_FOUND


def test_the_cpf_of_a_deleted_person_stays_taken(api_client: APIClient) -> None:
    person = make_individual(cpf=CPF_A)
    _ = person.delete()

    response = api_client.post(
        reverse(LIST), {"name": "Maria de novo", "people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "people_individual.cpf.duplicate_in_company" in error_codes(response, "people_individual.non_field_errors")


# ----- restore -----


def test_a_staff_user_cannot_restore(api_client: APIClient) -> None:
    person = archive(make_individual())

    response = api_client.post(reverse(RESTORE, args=[person.pk]))

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_a_superuser_restores_a_deleted_person(superuser_client: APIClient) -> None:
    person = archive(make_individual())

    response = superuser_client.post(reverse(RESTORE, args=[person.pk]))

    assert response.status_code == status.HTTP_200_OK
    assert Person.objects.filter(pk=person.pk).exists()


# ----- anonymize -----


def test_a_staff_user_cannot_anonymize(api_client: APIClient) -> None:
    person = archive(make_individual(), years_ago=6)

    assert api_client.post(reverse(ANONYMIZE, args=[person.pk])).status_code == status.HTTP_403_FORBIDDEN


def test_a_person_who_is_not_deleted_cannot_be_anonymized(superuser_client: APIClient) -> None:
    person = make_individual()

    response = superuser_client.post(reverse(ANONYMIZE, args=[person.pk]))

    assert response.status_code == status.HTTP_404_NOT_FOUND or error_codes(response, None) == [
        "person.anonymize.not_archived"
    ]


def test_anonymizing_is_refused_inside_the_retention_period(superuser_client: APIClient) -> None:
    person = archive(make_individual(), years_ago=1)

    response = superuser_client.post(reverse(ANONYMIZE, args=[person.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["person.anonymize.retention_period"]
    assert Person.all_objects.get(pk=person.pk).name == "Maria"


def test_anonymizing_replaces_the_personal_data_and_keeps_the_record(superuser_client: APIClient) -> None:
    person = archive(make_individual(job="Engenheira"), years_ago=6)

    response = superuser_client.post(reverse(ANONYMIZE, args=[person.pk]))

    assert response.status_code == status.HTTP_200_OK
    stored = Person.all_objects.get(pk=person.pk)
    assert stored.name == "Pessoa anonimizada"
    assert stored.email == ""
    assert stored.anonymized_at is not None
    assert stored.is_archived
    individual = PeopleIndividual.objects.get(person=person)
    assert individual.cpf == f"{stored.code:011d}"
    assert individual.job is None
    assert body(response)["id"] == str(person.pk)


def test_a_person_cannot_be_anonymized_twice(superuser_client: APIClient) -> None:
    person = archive(make_individual(), years_ago=6)
    _ = superuser_client.post(reverse(ANONYMIZE, args=[person.pk]))

    response = superuser_client.post(reverse(ANONYMIZE, args=[person.pk]))

    assert error_codes(response, None) == ["person.anonymize.already_done"]
