"""Dashboard counters and the global search cover only the user's company (spec 004, R9)."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.models import Company

from ..base import body
from ..scoping_data import build_company_data

pytestmark = pytest.mark.django_db


def dashboard(client: APIClient) -> dict[str, object]:
    return body(client.get(reverse("dashboard")))


def search(client: APIClient, term: str) -> dict[str, object]:
    return body(client.get(reverse("search"), {"q": term}))


def test_counters_ignore_other_companies(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    _ = build_company_data(other_company, seed=2)

    summary = dashboard(api_client)

    assert summary["condominiums"]["total"] == 0  # type: ignore[index]
    assert summary["units"]["total"] == 0  # type: ignore[index]
    assert summary["persons"]["total"] == 0  # type: ignore[index]
    assert summary["pending"]["without_cost_centers"] == 0  # type: ignore[index]


def test_counters_count_own_company_only(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    _ = build_company_data(company, seed=1)
    _ = build_company_data(other_company, seed=2)

    summary = dashboard(api_client)

    assert summary["condominiums"]["total"] == 1  # type: ignore[index]
    assert summary["persons"]["total"] == 1  # type: ignore[index]
    assert summary["pending"]["without_cost_centers"] == 1  # type: ignore[index]


def test_superuser_dashboard_covers_every_company(
    superuser_client: APIClient, company: Company, other_company: Company
) -> None:
    _ = build_company_data(company, seed=1)
    _ = build_company_data(other_company, seed=2)

    assert dashboard(superuser_client)["condominiums"]["total"] == 2  # type: ignore[index]


def test_accounts_payable_ignores_other_companies(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    from datetime import date

    from apps.finance.models import AccountPayable, Supplier
    from apps.persons.models import Person

    person = Person.objects.create(company=other_company, name="Fornecedor")
    _ = AccountPayable.objects.create(
        company=other_company,
        supplier=Supplier.objects.create(person=person),
        description="Despesa",
        amount="10.00",
        due_date=date(2000, 1, 1),
    )

    payables = dashboard(api_client)["accounts_payable"]

    assert payables["overdue"]["count"] == 0  # type: ignore[index]
    assert payables["upcoming"] == []  # type: ignore[index]


def test_search_hides_other_company_records(
    api_client: APIClient, other_company: Company
) -> None:
    other = build_company_data(other_company, seed=2)

    persons = search(api_client, other.person.name)["persons"]
    condominiums = search(api_client, other.condominium.name)["condominiums"]
    units = search(api_client, other.unit.name)["units"]

    assert persons == [] and condominiums == [] and units == []


def test_search_finds_own_company_records(api_client: APIClient, company: Company) -> None:
    mine = build_company_data(company, seed=1)

    assert len(search(api_client, mine.person.name)["persons"]) == 1  # type: ignore[arg-type]


def test_superuser_search_finds_other_company_records(
    superuser_client: APIClient, other_company: Company
) -> None:
    other = build_company_data(other_company, seed=2)

    assert len(search(superuser_client, other.condominium.name)["condominiums"]) == 1  # type: ignore[arg-type]
