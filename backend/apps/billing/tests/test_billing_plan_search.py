"""BillingPlanQuerySet.search: the billing plans group of the global search."""

import pytest

from apps.condominiums.models import Condominium
from apps.core.infrastructure.search.term import classify_term

from ..models import BillingPlan

pytestmark = pytest.mark.django_db


def make_plans(condominium: Condominium, *names: str) -> None:
    for name in names:
        BillingPlan.objects.create(condominium=condominium, name=name)


def found(term: str) -> list[str]:
    return [plan.name for plan in BillingPlan.objects.search(classify_term(term))]


def test_search_puts_the_names_that_start_with_the_term_first(condominium: Condominium) -> None:
    make_plans(condominium, "Fundo de Obras", "Obras Gerais", "Agua")

    assert found("obras") == ["Obras Gerais", "Fundo de Obras"]


def test_search_ignores_case(condominium: Condominium) -> None:
    make_plans(condominium, "Taxa Ordinaria")

    assert found("ORDINARIA") == ["Taxa Ordinaria"]


def test_a_single_digit_is_an_id_lookup_and_finds_no_plan(condominium: Condominium) -> None:
    make_plans(condominium, "Plano 1")

    assert found("1") == []


def test_search_with_no_match_is_empty(condominium: Condominium) -> None:
    make_plans(condominium, "Taxa Ordinaria")

    assert found("zzz") == []


def test_search_loads_the_condominium_in_the_same_query(condominium: Condominium, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_plans(condominium, "Taxa Ordinaria")

    with django_assert_num_queries(1):
        _ = [plan.condominium.name for plan in BillingPlan.objects.search(classify_term("taxa"))]
