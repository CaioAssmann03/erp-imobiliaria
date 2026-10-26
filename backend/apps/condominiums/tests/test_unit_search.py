"""UnitQuerySet.search: the units group of the global search."""


import pytest

from apps.core.models import Company
from apps.core.infrastructure.search.term import classify_term

from ..models import Condominium, Unit

pytestmark = pytest.mark.django_db


def make_units(company: Company, *names: str) -> None:
    condominium = Condominium.objects.create(company=company, name="Residencial", cnpj="11222333000181")
    for name in names:
        Unit.objects.create(condominium=condominium, name=name)


def found(term: str) -> list[str]:
    return [unit.name for unit in Unit.objects.search(classify_term(term))]


def test_search_by_number_puts_the_ones_that_start_with_the_term_first(company: Company) -> None:
    make_units(company, "A101", "101", "201")

    assert found("101") == ["101", "A101"]


def test_search_ignores_case(company: Company) -> None:
    make_units(company, "Loja Central")

    assert found("LOJA") == ["Loja Central"]


def test_a_single_digit_is_an_id_lookup_and_finds_no_unit(company: Company) -> None:
    make_units(company, "101", "201")

    assert found("1") == []


def test_search_with_no_match_is_empty(company: Company) -> None:
    make_units(company, "101")

    assert found("zzz") == []


def test_search_loads_the_condominium_in_the_same_query(company: Company, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_units(company, "101")

    with django_assert_num_queries(1):
        _ = [unit.condominium.name for unit in Unit.objects.search(classify_term("101"))]
