"""BlockQuerySet.search: the blocks group of the global search."""

import pytest

from apps.core.models import Company
from apps.core.infrastructure.search.term import classify_term

from ..models import Block, Condominium

pytestmark = pytest.mark.django_db


def make_blocks(company: Company, *names: str) -> None:
    condominium = Condominium.objects.create(company=company, name="Residencial", cnpj="11222333000181")
    for name in names:
        Block.objects.create(condominium=condominium, name=name)


def found(term: str) -> list[str]:
    return [block.name for block in Block.objects.search(classify_term(term))]


def test_search_puts_the_blocks_that_start_with_the_term_first(company: Company) -> None:
    make_blocks(company, "Torre Sul", "Sul", "Norte")

    assert found("sul") == ["Sul", "Torre Sul"]


def test_search_ignores_case(company: Company) -> None:
    make_blocks(company, "Torre Norte")

    assert found("TORRE") == ["Torre Norte"]


def test_a_single_digit_is_an_id_lookup_and_finds_no_block(company: Company) -> None:
    make_blocks(company, "Bloco 1")

    assert found("1") == []


def test_search_with_no_match_is_empty(company: Company) -> None:
    make_blocks(company, "Torre Sul")

    assert found("zzz") == []


def test_search_loads_the_condominium_in_the_same_query(company: Company, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_blocks(company, "Torre Sul")

    with django_assert_num_queries(1):
        _ = [block.condominium.name for block in Block.objects.search(classify_term("torre"))]
