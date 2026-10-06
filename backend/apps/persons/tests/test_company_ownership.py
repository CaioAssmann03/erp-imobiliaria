"""People belong to a company; documents are unique per company (spec 004, R2, R5)."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.core.testing import seeded_company

from ..models import PeopleIndividual, PeopleLegal, Person
from .base import CNPJ_A, CPF_A, body, make_individual, make_legal

pytestmark = pytest.mark.django_db


def test_person_company_is_not_nullable() -> None:
    assert Person._meta.get_field("company").null is False
    assert PeopleIndividual._meta.get_field("company").null is False
    assert PeopleLegal._meta.get_field("company").null is False


def test_same_cpf_is_allowed_in_two_companies(other_company: Company) -> None:
    _ = make_individual(cpf=CPF_A)
    _ = make_individual(name="Mesma pessoa", cpf=CPF_A, company=other_company)

    assert PeopleIndividual.objects.filter(cpf=CPF_A).count() == 2


def test_same_cpf_is_rejected_in_one_company() -> None:
    _ = make_individual(cpf=CPF_A)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_individual(name="Outra", cpf=CPF_A)


def test_same_cpf_in_one_company_is_a_400_in_the_api(api_client: APIClient) -> None:
    _ = make_individual(cpf=CPF_A)

    response = api_client.post(
        "/api/persons/", {"name": "Outra", "people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Person.objects.count() == 1


def test_same_cpf_in_another_company_is_accepted_by_the_api(
    other_api_client: APIClient, other_company: Company
) -> None:
    _ = make_individual(cpf=CPF_A)

    response = other_api_client.post(
        "/api/persons/", {"name": "Mesma", "people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert Person.objects.get(pk=body(response)["id"]).company == other_company


def test_same_cnpj_is_allowed_per_company_only(other_company: Company) -> None:
    _ = make_legal(cnpj=CNPJ_A)
    _ = make_legal(name="Outra empresa", cnpj=CNPJ_A, company=other_company)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_legal(name="Duplicada", cnpj=CNPJ_A)


def test_same_rg_is_unique_per_company(other_company: Company) -> None:
    first = make_individual(cpf=CPF_A)
    _ = PeopleIndividual.objects.filter(pk=first.pk).update(rg="123456")
    second = make_individual(name="Outra", cpf="11144477735", company=other_company)
    _ = PeopleIndividual.objects.filter(pk=second.pk).update(rg="123456")

    third = make_individual(name="Terceira", cpf="39053344705")
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = PeopleIndividual.objects.filter(pk=third.pk).update(rg="123456")


def test_document_company_must_match_the_person(other_company: Company) -> None:
    person = Person.objects.create(company=seeded_company(), name="Maria")
    document = PeopleIndividual(person=person, company=other_company, cpf=CPF_A)

    with pytest.raises(ValidationError) as error:
        document.clean()

    assert "company" in error.value.message_dict


def test_document_company_is_filled_from_the_person() -> None:
    person = Person.objects.create(company=seeded_company(), name="Maria")
    document = PeopleIndividual(person=person, cpf=CPF_A)

    document.clean()

    assert document.company_id == person.company_id


def test_create_takes_company_from_user(api_client: APIClient, company: Company) -> None:
    response = api_client.post("/api/persons/", {"name": "Maria"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Person.objects.get(pk=body(response)["id"]).company == company
    assert body(response)["company"] == company.pk


def test_company_in_the_body_is_ignored(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    response = api_client.post(
        "/api/persons/", {"name": "Maria", "company": str(other_company.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Person.objects.get(pk=body(response)["id"]).company == company


def test_patch_cannot_move_a_person_to_another_company(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    person = make_individual()

    response = api_client.patch(
        f"/api/persons/{person.pk}/", {"company": str(other_company.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    person.refresh_from_db()
    assert person.company == company


def test_individual_document_copies_the_company(api_client: APIClient, company: Company) -> None:
    response = api_client.post(
        "/api/persons/", {"name": "Maria", "people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert PeopleIndividual.objects.get(cpf=CPF_A).company == company
