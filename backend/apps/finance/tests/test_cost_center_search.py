"""CostCenterQuerySet.search: the cost centers group of the global search."""

import pytest

from apps.core.infrastructure.search.term import classify_term

from ..models import CostCenter

pytestmark = pytest.mark.django_db


def make_cost_centers(condominium, *names: str) -> None:  # type: ignore[no-untyped-def]
    for name in names:
        CostCenter.objects.create(condominium=condominium, name=name)


def found(term: str) -> list[str]:
    return [cost_center.name for cost_center in CostCenter.objects.search(classify_term(term))]


def test_search_puts_the_names_that_start_with_the_term_first(condominium) -> None:  # type: ignore[no-untyped-def]
    make_cost_centers(condominium, "Fundo de Obras", "Obras Gerais", "Agua")

    assert found("obras") == ["Obras Gerais", "Fundo de Obras"]


def test_search_ignores_case(condominium) -> None:  # type: ignore[no-untyped-def]
    make_cost_centers(condominium, "Fundo de Reserva")

    assert found("RESERVA") == ["Fundo de Reserva"]


def test_a_single_digit_is_an_id_lookup_and_finds_no_cost_center(condominium) -> None:  # type: ignore[no-untyped-def]
    make_cost_centers(condominium, "Fundo 1")

    assert found("1") == []


def test_search_with_no_match_is_empty(condominium) -> None:  # type: ignore[no-untyped-def]
    make_cost_centers(condominium, "Fundo de Reserva")

    assert found("zzz") == []


def test_search_loads_the_condominium_in_the_same_query(condominium, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_cost_centers(condominium, "Fundo de Reserva")

    with django_assert_num_queries(1):
        _ = [cost_center.condominium.name for cost_center in CostCenter.objects.search(classify_term("fundo"))]
