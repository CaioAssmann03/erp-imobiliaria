"""PersonQuerySet.search: the people group of the global search."""

import pytest

from apps.core.models import Company
from apps.core.infrastructure.search.term import classify_term

from ..models import Person
from .base import CNPJ_A, CNPJ_B, CPF_A, CPF_B, make_individual, make_legal

pytestmark = pytest.mark.django_db


def found(term: str) -> list[str]:
    return [person.name for person in Person.objects.search(classify_term(term))]


def test_search_by_name_puts_the_ones_that_start_with_the_term_first(company: Company) -> None:
    make_individual("Ana Maria", CPF_A, company=company)
    make_individual("Maria Souza", CPF_B, company=company)
    make_legal("Joao LTDA", CNPJ_A, company=company)

    assert found("maria") == ["Maria Souza", "Ana Maria"]


def test_search_by_cpf_finds_individuals_only(company: Company) -> None:
    make_individual("Maria", CPF_A, company=company)
    make_legal("Empresa", CNPJ_A, company=company)

    assert found("529.982") == ["Maria"]


def test_search_by_cnpj_finds_legal_entities_only(company: Company) -> None:
    make_individual("Maria", CPF_A, company=company)
    make_legal("Empresa", CNPJ_B, company=company)

    assert found("45.723.174") == ["Empresa"]


def test_search_by_id_puts_the_typed_id_first(company: Company) -> None:
    first = make_individual("Maria", CPF_A, company=company)
    make_individual("Joao", CPF_B, company=company)

    assert found(str(first.code))[0] == "Maria"


def test_search_annotates_the_document_of_each_person(company: Company) -> None:
    make_individual("Maria", CPF_A, company=company)
    make_legal("Empresa", CNPJ_A, company=company)

    documents = {person.name: person.document for person in Person.objects.search(classify_term("a"))}  # type: ignore[attr-defined]

    assert documents == {"Maria": CPF_A, "Empresa": CNPJ_A}
