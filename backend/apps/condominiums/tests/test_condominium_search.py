"""CondominiumQuerySet.search: the condominium group of the global search."""

import pytest

from apps.core.models import Company
from apps.core.infrastructure.search.term import classify_term

from ..models import Condominium

pytestmark = pytest.mark.django_db

CNPJS = ["11222333000181", "45723174000110", "11444777000161"]


def make_condominium(company: Company, name: str, cnpj: str) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj)


def found(term: str) -> list[str]:
    return [condominium.name for condominium in Condominium.objects.search(classify_term(term))]


def test_search_by_name_puts_the_ones_that_start_with_the_term_first(company: Company) -> None:
    make_condominium(company, "Edificio Solar", CNPJS[0])
    make_condominium(company, "Solaris", CNPJS[1])
    make_condominium(company, "Lua", CNPJS[2])

    assert found("sola") == ["Solaris", "Edificio Solar"]


def test_search_by_name_ignores_case(company: Company) -> None:
    make_condominium(company, "Residencial Sol", CNPJS[0])

    assert found("RESIDENCIAL") == ["Residencial Sol"]


def test_search_by_cnpj_digits_with_or_without_punctuation(company: Company) -> None:
    make_condominium(company, "Alfa", CNPJS[0])
    make_condominium(company, "Beta", CNPJS[1])

    assert found("11.222.333") == ["Alfa"]
    assert found("11222333") == ["Alfa"]


def test_search_by_id_puts_the_typed_id_first(company: Company) -> None:
    first = make_condominium(company, "Alfa", CNPJS[0])
    make_condominium(company, "Beta", CNPJS[1])

    assert found(str(first.code))[0] == "Alfa"


def test_search_with_no_match_is_empty(company: Company) -> None:
    make_condominium(company, "Alfa", CNPJS[0])

    assert found("zzzz") == []


def test_search_loads_the_address_in_the_same_query(company: Company, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_condominium(company, "Alfa", CNPJS[0])

    with django_assert_num_queries(1):
        _ = [condominium.address for condominium in Condominium.objects.search(classify_term("alfa"))]
