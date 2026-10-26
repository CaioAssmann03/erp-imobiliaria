"""Search by ID (spec 019, R4, R6, R8): the record whose number was typed comes first.

People and condominiums have an ID; a unit has none and is found by its number (its name).
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit
from apps.core.infrastructure.search.term import classify_term
from apps.core.serializers import SearchSerializer
from apps.core.views.search.search_views import SEARCHES_BY_GROUP
from apps.core.testing import seeded_company
from apps.persons.models import PeopleIndividual, Person
from apps.persons.services.release_person_to_module import release_person_to_module

from ..base import body

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"
OTHER_CNPJ = "45723174000110"
CPF = "12345678901"


def search(client: APIClient, term: str, **params: str) -> Response:
    return client.get(reverse("search"), {"q": term, **params})


def names(response: Response, group: str) -> list[str]:
    return [row["name"] for row in body(response)[group]]


def make_person(name: str, code: int, modules: list[str] | None = None) -> Person:
    person = Person.objects.create(company=seeded_company(), name=name, code=code)
    for module in ["condominiums"] if modules is None else modules:
        release_person_to_module(person, module)
    return person


def make_condominium(name: str, code: int, cnpj: str = CNPJ) -> Condominium:
    return Condominium.objects.create(company=seeded_company(), name=name, code=code, cnpj=cnpj)


def make_unit(condominium: Condominium, name: str) -> Unit:
    return Unit.objects.create(condominium=condominium, name=name)


def test_people_and_condominiums_carry_the_code(api_client: APIClient) -> None:
    _ = make_person("Maria Silva", 51)
    _ = make_condominium("Residencial Sol", 52)

    assert body(search(api_client, "maria"))["persons"][0]["code"] == 51
    assert body(search(api_client, "residencial"))["condominiums"][0]["code"] == 52


def test_a_unit_is_found_by_its_number_and_has_no_code(api_client: APIClient) -> None:
    condominium = make_condominium("Residencial Sol", 52)
    _ = make_unit(condominium, "101")
    _ = make_unit(condominium, "202")

    found = body(search(api_client, "101"))

    assert [unit["name"] for unit in found["units"]] == ["101"]
    assert "code" not in found["units"][0]


@pytest.mark.parametrize("term", ["42", "4242"])
def test_digits_only_term_puts_the_code_match_first(api_client: APIClient, term: str) -> None:
    code = int(term)
    _ = make_person("Zeca", code)
    _ = make_person(f"Ana {term}", code + 1)
    first_condominium = make_condominium("Zeta", code)
    _ = make_condominium(f"Alfa {term}", code + 1, OTHER_CNPJ)
    _ = make_unit(first_condominium, f"A-{term}")

    found = search(api_client, term)

    # By name the "A…" records would come first; the ID that was typed comes before them.
    assert names(found, "persons") == ["Zeca", f"Ana {term}"]
    assert names(found, "condominiums") == ["Zeta", f"Alfa {term}"]
    # A unit has no ID: it matches only by its number.
    assert names(found, "units") == [f"A-{term}"]


def test_one_digit_term_returns_only_the_code_match(api_client: APIClient) -> None:
    _ = make_person("Zeca", 7)
    _ = make_person("Ana 7", 9)
    first_condominium = make_condominium("Zeta", 7)
    _ = make_condominium("Bloco 7", 9, OTHER_CNPJ)
    _ = make_unit(first_condominium, "A-7")

    found = search(api_client, "7")

    assert names(found, "persons") == ["Zeca"]
    assert names(found, "condominiums") == ["Zeta"]
    assert names(found, "units") == []


def test_a_document_start_comes_after_the_exact_match(api_client: APIClient) -> None:
    _ = make_person("Zeca", 123)
    with_cpf = make_person("Ana", 124)
    _ = PeopleIndividual.objects.create(person=with_cpf, company=seeded_company(), cpf=CPF)

    assert names(search(api_client, "123"), "persons") == ["Zeca", "Ana"]


@pytest.mark.parametrize("term", ["9" * 19, "9" * 40])
def test_long_digit_terms_do_not_overflow(api_client: APIClient, term: str) -> None:
    response = search(api_client, term)

    assert response.status_code == status.HTTP_200_OK
    assert all(group == [] for group in body(response).values())


def test_global_search_finds_people_of_every_module(api_client: APIClient) -> None:
    _ = make_person("Maria Cond", 1001, ["condominiums"])
    _ = make_person("Maria Loc", 1002, ["rentals"])
    _ = make_person("Maria Mix", 1003, ["condominiums", "rentals"])
    _ = make_person("Maria Nenhuma", 1004, [])

    assert names(search(api_client, "maria"), "persons") == [
        "Maria Cond",
        "Maria Loc",
        "Maria Mix",
        "Maria Nenhuma",
    ]


def test_search_by_code_does_not_cross_companies(other_api_client: APIClient) -> None:
    _ = make_person("Zeca", 4242)

    assert body(search(other_api_client, "4242"))["persons"] == []


@pytest.mark.parametrize(
    ("term", "is_searchable", "code", "matches_text", "matches_document"),
    [
        ("7", True, 7, False, False),
        ("42", True, 42, True, False),
        ("123", True, 123, True, True),
        ("0042", True, 42, True, True),
        ("1234567890123456789", True, None, True, True),
        ("1.2.3", True, None, True, True),
        ("12.", True, None, True, False),
        ("1.", False, None, True, False),
        ("ma", False, None, True, False),
        ("mar", True, None, True, False),
    ],
)
def test_term_classification(
    term: str,
    is_searchable: bool,
    code: int | None,
    matches_text: bool,
    matches_document: bool,
) -> None:
    classified = classify_term(term)

    assert classified.is_searchable is is_searchable
    assert classified.code == code
    assert classified.matches_text is matches_text
    assert classified.matches_document is matches_document


def test_every_search_group_is_in_the_response_schema() -> None:
    """A group added to one side and forgotten in the other would be dropped or never filled."""
    assert set(SEARCHES_BY_GROUP) == set(SearchSerializer().fields)
