"""The list search by ID (spec 019, R5): `QuerySearchFilter` with `search_code_field`."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.api.codes import code_from_term
from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..base import results


@pytest.mark.parametrize(
    ("term", "code"),
    [
        ("7", 7),
        ("0042", 42),
        ("123456789012345678", 123456789012345678),
        ("1234567890123456789", None),
        ("12.3", None),
        ("-5", None),
        ("abc", None),
        ("", None),
        ("١٢", None),
    ],
)
def test_only_a_short_ascii_digit_term_is_an_id(term: str, code: int | None) -> None:
    assert code_from_term(term) == code


@pytest.mark.django_db
def test_the_views_own_ordering_is_kept_after_the_exact_match(api_client: APIClient) -> None:
    company = seeded_company()
    for name, code in (("Beto 99", 1), ("Ana 99", 2), ("Zeca", 99)):
        _ = Person.objects.create(company=company, name=name, code=code)

    response = api_client.get(reverse("person-list"), {"query": "99"})

    assert [person["name"] for person in results(response)] == ["Zeca", "Ana 99", "Beto 99"]


@pytest.mark.django_db
def test_a_term_that_is_not_an_id_orders_as_before(api_client: APIClient) -> None:
    company = seeded_company()
    for name, code in (("Beto Silva", 1), ("Ana Silva", 2)):
        _ = Person.objects.create(company=company, name=name, code=code)

    response = api_client.get(reverse("person-list"), {"query": "silva"})

    assert [person["name"] for person in results(response)] == ["Ana Silva", "Beto Silva"]
