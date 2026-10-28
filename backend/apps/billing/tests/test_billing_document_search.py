"""BillingDocumentQuerySet.search: the billing documents group of the global search."""

from datetime import date

import pytest

from apps.core.models import Company
from apps.core.infrastructure.search.term import classify_term
from apps.persons.models import Person

from ..models import BillingDocument
from ..services.create_billing_document import create_billing_document

pytestmark = pytest.mark.django_db


def found(term: str) -> list[tuple[str, str]]:
    return [
        (document.payer.name, document.unit.name)
        for document in BillingDocument.objects.search(classify_term(term))
    ]


def test_search_by_payer_name(billing_rules, new_document, company: Company, make_unit) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document())
    other_payer = Person.objects.create(company=company, name="Joao Lima")
    create_billing_document(new_document(unit=make_unit("102"), payer=other_payer))

    assert found("souza") == [("Maria Souza", "101")]


def test_search_by_unit_number(billing_rules, new_document, make_unit) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document())
    create_billing_document(new_document(unit=make_unit("202")))

    assert found("202") == [("Maria Souza", "202")]


def test_search_puts_the_ones_that_start_with_the_term_first(billing_rules, new_document, company: Company, make_unit) -> None:  # type: ignore[no-untyped-def]
    contains = Person.objects.create(company=company, name="Ana Maria")
    create_billing_document(new_document(payer=contains))
    create_billing_document(new_document(unit=make_unit("102")))

    assert found("maria") == [("Maria Souza", "102"), ("Ana Maria", "101")]


def test_search_among_equals_the_latest_reference_month_comes_first(billing_rules, new_document) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document(reference_month=date(2026, 9, 1), competence_month=date(2026, 9, 1), due_date=date(2026, 9, 10)))
    create_billing_document(new_document(reference_month=date(2026, 11, 1), competence_month=date(2026, 11, 1), due_date=date(2026, 11, 10)))

    months = [document.reference_month for document in BillingDocument.objects.search(classify_term("souza"))]

    assert months == [date(2026, 11, 1), date(2026, 9, 1)]


def test_a_single_digit_is_an_id_lookup_and_finds_no_document(billing_rules, new_document) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document())

    assert found("1") == []


def test_search_with_no_match_is_empty(billing_rules, new_document) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document())

    assert found("zzz") == []


def test_search_loads_unit_condominium_and_payer_in_the_same_query(billing_rules, new_document, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    create_billing_document(new_document())

    with django_assert_num_queries(1):
        _ = [
            (document.unit.condominium.name, document.payer.name)
            for document in BillingDocument.objects.search(classify_term("souza"))
        ]
