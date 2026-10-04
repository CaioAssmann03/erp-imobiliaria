
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.condominiums.models import Address, Condominium, Unit
from apps.core.models import Company
from apps.persons.models import PeopleIndividual, Person

from .base import JsonObject, body

pytestmark = pytest.mark.django_db

CPF = "52998224725"
CNPJ = "11222333000181"


@pytest.fixture
def data() -> None:
    company = Company.objects.create(legal_name="Adm", cnpj="00000000000191")
    address = Address.objects.create(city="Curitiba", state="PR")
    condominium = Condominium.objects.create(
        company=company, address=address, name="Residencial Sol", cnpj=CNPJ
    )
    _ = Unit.objects.create(condominium=condominium, name="101")
    person = Person.objects.create(name="Maria Silva")
    _ = PeopleIndividual.objects.create(person=person, cpf=CPF)


def search(client: APIClient, term: str) -> JsonObject:
    return body(client.get(reverse("search"), {"q": term}))


def test_short_term_returns_nothing(api_client: APIClient, data: None) -> None:
    result = search(api_client, "ma")

    assert result == {"persons": [], "condominiums": [], "units": []}


def test_finds_person_by_name(api_client: APIClient, data: None) -> None:
    result = search(api_client, "maria")

    assert [p["name"] for p in result["persons"]] == ["Maria Silva"]
    assert result["persons"][0]["document"] == CPF


def test_finds_person_by_cpf_with_punctuation(api_client: APIClient, data: None) -> None:
    result = search(api_client, "529.982.247-25")

    assert [p["name"] for p in result["persons"]] == ["Maria Silva"]


def test_finds_condominium_by_name_and_cnpj(api_client: APIClient, data: None) -> None:
    by_name = search(api_client, "residencial")
    by_cnpj = search(api_client, "11.222.333/0001-81")

    assert by_name["condominiums"][0]["city"] == "Curitiba"
    assert [c["name"] for c in by_cnpj["condominiums"]] == ["Residencial Sol"]


def test_finds_unit_by_name(api_client: APIClient, data: None) -> None:
    result = search(api_client, "101")

    assert result["units"][0]["condominium_name"] == "Residencial Sol"


def test_condominium_without_address(api_client: APIClient) -> None:
    company = Company.objects.create(legal_name="Adm", cnpj="00000000000191")
    _ = Condominium.objects.create(company=company, name="Sem Endereço", cnpj=CNPJ)

    result = search(api_client, "sem")

    assert result["condominiums"][0]["city"] is None


