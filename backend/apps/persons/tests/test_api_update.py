from collections.abc import Callable

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ..models import PeopleIndividual, PeopleLegal, Person
from .base import CNPJ_A, CNPJ_B, CPF_A, CPF_B, make_individual, make_legal

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
    assert person.people_individual.cpf == CPF_A


def test_patch_same_cpf_does_not_fail(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(cpf=CPF_A)

    response = api_client.patch(
        detail_url(person), {"people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK


def test_patch_cpf_of_another_person_is_rejected(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    _ = make_individual(name="Outra", cpf=CPF_B)
    person = make_individual(cpf=CPF_A)

    response = api_client.patch(
        detail_url(person), {"people_individual": {"cpf": CPF_B}}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert person.people_individual.cpf == CPF_A


def test_patch_changes_cpf_of_same_person(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(cpf=CPF_A)

    response = api_client.patch(
        detail_url(person), {"people_individual": {"cpf": CPF_B}}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert PeopleIndividual.objects.get(person=person).cpf == CPF_B
    assert PeopleIndividual.objects.count() == 1


def test_patch_same_cnpj_does_not_fail(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_legal(cnpj=CNPJ_A)

    response = api_client.patch(
        detail_url(person), {"people_legal": {"cnpj": CNPJ_A, "ie": "9"}}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert PeopleLegal.objects.get(person=person).ie == "9"


def test_patch_cnpj_of_another_person_is_rejected(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    _ = make_legal(name="Outra", cnpj=CNPJ_B)
    person = make_legal(cnpj=CNPJ_A)

    response = api_client.patch(
        detail_url(person), {"people_legal": {"cnpj": CNPJ_B}}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_patch_adds_document_to_person_without_one(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = Person.objects.create(name="Sem doc")

    response = api_client.patch(
        detail_url(person), {"people_individual": {"cpf": CPF_A}}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert PeopleIndividual.objects.get(person=person).cpf == CPF_A


def test_patch_without_nested_keeps_documents(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(cpf=CPF_A)

    response = api_client.patch(detail_url(person), {"name": "Novo"}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert PeopleIndividual.objects.get(person=person).cpf == CPF_A


def test_patch_clearing_optional_fields_like_the_form_does(
    api_client: APIClient, detail_url: Callable[[Person], str]
) -> None:
    person = make_individual(cpf=CPF_A, job="Engenheira")
    person.cell_number = "(41) 99999-9999"
    person.email = "maria@exemplo.com"
    person.save()

    response = api_client.patch(
        detail_url(person),
        {
            "cell_number": None,
            "email": "",
            "people_individual": {"cpf": CPF_A, "rg": None, "birthday": None, "job": None},
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    person.refresh_from_db()
    assert person.cell_number is None
    assert person.email == ""
    assert person.people_individual.job is None
