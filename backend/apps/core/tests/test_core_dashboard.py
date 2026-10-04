from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.models import Company
from apps.financeiro.models import CostCenter
from apps.persons.models import PeopleIndividual, Person

pytestmark = pytest.mark.django_db

today = timezone.localdate


@pytest.fixture
def company() -> Company:
    return Company.objects.create(legal_name="Adm", cnpj="00000000000191")


def make_condominium(company: Company, name: str, cnpj: str, **kw: object) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj, **kw)


def dashboard(client: APIClient) -> dict[str, dict[str, object]]:
    return client.get(reverse("dashboard")).data  # pyright: ignore


def test_empty_dashboard(api_client: APIClient) -> None:
    data = dashboard(api_client)

    assert data["condominiums"]["total"] == 0
    assert data["fixed_revenue"]["monthly_total"] == "0.00"
    assert [m["month"] for m in data["adjustments_by_month"]][0] == "overdue"  # pyright: ignore


def test_summaries_count_by_type(api_client: APIClient, company: Company) -> None:
    _ = make_condominium(company, "A", "11222333000181", type="commercial")
    _ = make_condominium(company, "B", "45723174000110", active=False)
    person = Person.objects.create(name="Maria")
    _ = PeopleIndividual.objects.create(person=person, cpf="52998224725")

    data = dashboard(api_client)

    assert data["condominiums"]["total"] == 2
    assert data["condominiums"]["active"] == 1
    by_type = {t["type"]: t["total"] for t in data["condominiums"]["by_type"]}  # pyright: ignore
    assert by_type == {"residential": 1, "commercial": 1}
    persons = {t["type"]: t["total"] for t in data["persons"]["by_type"]}  # pyright: ignore
    assert persons == {"individual": 1, "legal": 0}


def test_fixed_revenue_ignores_variable_and_inactive(
    api_client: APIClient, company: Company
) -> None:
    fixed = make_condominium(company, "Fixo", "11222333000181")
    variable = make_condominium(company, "Variavel", "45723174000110")
    inactive = make_condominium(company, "Inativo", "03136483000144", active=False)
    _ = AdministrationContract.objects.create(
        condominium=fixed, fee_type="fixed", fee_amount=Decimal("500")
    )
    _ = AdministrationContract.objects.create(
        condominium=variable,
        fee_type="variable",
        fee_percentage=Decimal("5"),
        fee_basis="revenue",
    )
    _ = AdministrationContract.objects.create(
        condominium=inactive, fee_type="fixed", fee_amount=Decimal("900")
    )

    revenue = dashboard(api_client)["fixed_revenue"]

    assert revenue["monthly_total"] == "500.00"
    assert revenue["fixed_condominiums"] == 1
    assert revenue["variable_condominiums"] == 1
    assert [c["name"] for c in revenue["largest"]] == ["Fixo"]  # pyright: ignore


def test_adjustments_overdue_and_upcoming(
    api_client: APIClient, company: Company
) -> None:
    late = make_condominium(company, "Atrasado", "11222333000181")
    soon = make_condominium(company, "Em breve", "45723174000110")
    for condominium, days in ((late, -20), (soon, 18)):
        _ = AdministrationContract.objects.create(
            condominium=condominium,
            fee_amount=Decimal("1"),
            adjustment_period_months=12,
            adjustment_base_date=today() + timedelta(days=days) - timedelta(days=365),
        )

    data = dashboard(api_client)

    assert data["pending"]["overdue_adjustments"] == 1
    assert data["pending"]["adjustments_next_30_days"] == 1
    assert data["upcoming_adjustments"][0]["overdue"] is True  # pyright: ignore
    assert data["adjustments_by_month"][0]["total"] == 1  # pyright: ignore


def test_units_without_responsible(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "A", "11222333000181")
    with_owner = Unit.objects.create(condominium=condominium, name="101")
    ended = Unit.objects.create(condominium=condominium, name="102")
    _ = Unit.objects.create(condominium=condominium, name="103")
    _ = Unit.objects.create(condominium=condominium, name="104", active=False)
    person = Person.objects.create(name="Maria")
    _ = UnitPerson.objects.create(
        unit=with_owner,
        person=person,
        role="owner",
        ownership_percentage=Decimal("100"),
        start_date=today() - timedelta(days=100),
    )
    _ = UnitPerson.objects.create(
        unit=ended,
        person=person,
        role="tenant",
        start_date=today() - timedelta(days=100),
        end_date=today() - timedelta(days=10),
    )

    data = dashboard(api_client)

    assert data["responsibles"]["active_units"] == 3
    assert data["responsibles"]["with_responsible"] == 1
    assert data["pending"]["units_without_responsible"] == 2


def test_leases_ending_soon(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "A", "11222333000181")
    person = Person.objects.create(name="Inquilino")
    for name, days in (("101", 25), ("102", -10), ("103", 200), ("104", None)):
        unit = Unit.objects.create(condominium=condominium, name=name)
        _ = UnitPerson.objects.create(
            unit=unit,
            person=person,
            role="tenant",
            start_date=today() - timedelta(days=400),
            end_date=today() + timedelta(days=days) if days is not None else None,
        )

    data = dashboard(api_client)

    assert data["pending"]["leases_ending"] == 2
    assert [(lease["unit"], lease["ended"]) for lease in data["leases"]] == [  # pyright: ignore
        ("102", True),
        ("101", False),
    ]
    assert data["leases"][0]["tenant"] == "Inquilino"  # pyright: ignore


def test_apportionment_must_sum_to_one(api_client: APIClient, company: Company) -> None:
    ok = make_condominium(company, "Ok", "11222333000181")
    wrong = make_condominium(company, "Errado", "45723174000110")
    for name in ("1", "2"):
        _ = Unit.objects.create(
            condominium=ok, name=name, ideal_fraction=Decimal("0.5")
        )
    _ = Unit.objects.create(
        condominium=wrong, name="1", ideal_fraction=Decimal("0.9")
    )

    assert dashboard(api_client)["pending"]["inconsistent_apportionment"] == 1


def test_cost_centers_and_billing_block(api_client: APIClient, company: Company) -> None:
    with_centers = make_condominium(company, "Com", "11222333000181")
    _ = make_condominium(company, "Sem", "45723174000110")
    _ = CostCenter.objects.create(condominium=with_centers, name="Fundo")
    _ = Unit.objects.create(
        condominium=with_centers, name="1", is_billing_blocked=True
    )

    pending = dashboard(api_client)["pending"]

    assert pending["without_cost_centers"] == 1
    assert pending["billing_blocked_units"] == 1
