from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.testing import seeded_company
from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.models import Company
from apps.core.dates import add_months
from apps.finance.models import AccountPayable, CostCenter, Supplier
from apps.finance.services.cancel_account_payable import cancel_account_payable
from apps.finance.services.settle_account_payable import AccountPayablePayment, settle_account_payable
from apps.persons.models import PeopleIndividual, Person

from ..base import JsonObject, body

pytestmark = pytest.mark.django_db

today = timezone.localdate


def make_condominium(company: Company, name: str, cnpj: str, **kw: object) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj, **kw)


def dashboard(client: APIClient) -> JsonObject:
    return body(client.get(reverse("dashboard")))


def test_empty_dashboard(api_client: APIClient) -> None:
    summary = dashboard(api_client)

    assert summary["condominiums"]["total"] == 0
    assert summary["fixed_revenue"]["monthly_total"] == "0.00"
    assert [entry["month"] for entry in summary["adjustments_by_month"]][0] == "overdue"


def test_summaries_count_by_type(api_client: APIClient, company: Company) -> None:
    _ = make_condominium(company, "A", "11222333000181", type="commercial")
    _ = make_condominium(company, "B", "45723174000110", active=False)
    person = Person.objects.create(company=seeded_company(), name="Maria")
    _ = PeopleIndividual.objects.create(person=person, company=person.company, cpf="52998224725")

    summary = dashboard(api_client)

    assert summary["condominiums"]["total"] == 2
    assert summary["condominiums"]["active"] == 1
    by_type = {entry["type"]: entry["total"] for entry in summary["condominiums"]["by_type"]}
    assert by_type == {"residential": 1, "commercial": 1}
    persons = {entry["type"]: entry["total"] for entry in summary["persons"]["by_type"]}
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
    assert [condominium["name"] for condominium in revenue["largest"]] == ["Fixo"]


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

    summary = dashboard(api_client)

    assert summary["pending"]["overdue_adjustments"] == 1
    assert summary["pending"]["adjustments_next_30_days"] == 1
    assert summary["upcoming_adjustments"][0]["overdue"] is True
    assert summary["adjustments_by_month"][0]["total"] == 1


def test_units_without_responsible(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "A", "11222333000181")
    with_owner = Unit.objects.create(condominium=condominium, name="101")
    ended = Unit.objects.create(condominium=condominium, name="102")
    _ = Unit.objects.create(condominium=condominium, name="103")
    _ = Unit.objects.create(condominium=condominium, name="104", active=False)
    person = Person.objects.create(company=seeded_company(), name="Maria")
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

    summary = dashboard(api_client)

    assert summary["responsibles"]["active_units"] == 3
    assert summary["responsibles"]["with_responsible"] == 1
    assert summary["pending"]["units_without_responsible"] == 2


def test_leases_ending_soon(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "A", "11222333000181")
    person = Person.objects.create(company=seeded_company(), name="Inquilino")
    for name, days in (("101", 25), ("102", -10), ("103", 200), ("104", None)):
        unit = Unit.objects.create(condominium=condominium, name=name)
        _ = UnitPerson.objects.create(
            unit=unit,
            person=person,
            role="tenant",
            start_date=today() - timedelta(days=400),
            end_date=today() + timedelta(days=days) if days is not None else None,
        )

    summary = dashboard(api_client)

    assert summary["pending"]["leases_ending"] == 2
    assert [(lease["unit"], lease["ended"]) for lease in summary["leases"]] == [
        ("102", True),
        ("101", False),
    ]
    assert summary["leases"][0]["tenant"] == "Inquilino"


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


def test_upcoming_adjustments_expose_adjustment_index(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "A", "11222333000181")
    _ = AdministrationContract.objects.create(
        condominium=condominium,
        fee_type="fixed",
        fee_amount=100,
        adjustment_index="IGPM",
        adjustment_period_months=12,
        adjustment_base_date=today() - timedelta(days=300),
    )

    adjustment = dashboard(api_client)["upcoming_adjustments"][0]

    assert adjustment["adjustment_index"] == "IGPM"
    assert "index" not in adjustment



# ----- spec 012: accounts payable section -----


def make_payable(company: Company, due_date: date, **overrides: object) -> AccountPayable:
    condominium = overrides.pop("condominium", None)
    cost_center = (
        CostCenter.objects.get_or_create(condominium=condominium, name="Geral")[0]
        if isinstance(condominium, Condominium)
        else None
    )
    person = Person.objects.create(company=company, name="Companhia de Energia")
    fields = {
        "company": company,
        "condominium": condominium,
        "cost_center": cost_center,
        "supplier": Supplier.objects.create(person=person),
        "description": "Energia elétrica",
        "amount": Decimal("100.00"),
        "due_date": due_date,
    }
    return AccountPayable.objects.create(**{**fields, **overrides})


def test_accounts_payable_empty(api_client: APIClient) -> None:
    payables = dashboard(api_client)["accounts_payable"]

    assert payables["overdue"] == {"count": 0, "total": "0.00"}
    assert payables["upcoming"] == []


def test_accounts_payable_windows_and_totals(api_client: APIClient, company: Company) -> None:
    reference = today()
    condominium = make_condominium(company, "Residencial Sol", "11222333000181")
    make_payable(company, reference - timedelta(days=3), condominium=condominium)
    make_payable(company, reference, amount=Decimal("50.00"))  # company expense
    make_payable(company, reference + timedelta(days=7))
    make_payable(company, reference + timedelta(days=8))

    payables = dashboard(api_client)["accounts_payable"]

    assert payables["overdue"] == {"count": 1, "total": "100.00"}
    assert payables["due_today"] == {"count": 1, "total": "50.00"}
    assert payables["due_next_7_days"] == {"count": 1, "total": "100.00"}
    assert [entry["overdue"] for entry in payables["upcoming"]] == [True, False, False, False]
    assert payables["upcoming"][0]["condominium_name"] == "Residencial Sol"
    assert payables["upcoming"][1]["condominium_name"] is None
    assert payables["upcoming"][0]["supplier_name"] == "Companhia de Energia"


def test_accounts_payable_this_month_counts_the_calendar_month(
    api_client: APIClient, company: Company
) -> None:
    reference = today()
    first_day = reference.replace(day=1)
    next_month = add_months(first_day, 1)
    make_payable(company, first_day)
    make_payable(company, next_month)
    make_payable(company, first_day - timedelta(days=1))  # last month: overdue, not "this month"

    payables = dashboard(api_client)["accounts_payable"]

    assert payables["due_this_month"] == {"count": 1, "total": "100.00"}


def test_accounts_payable_ignores_paid_and_cancelled(
    api_client: APIClient, company: Company, staff_user: User
) -> None:
    reference = today()
    paid = make_payable(company, reference - timedelta(days=1))
    settle_account_payable(
        paid, AccountPayablePayment(reference, Decimal("100.00"), AccountPayable.PaymentMethod.PIX, staff_user)
    )
    cancelled = make_payable(company, reference - timedelta(days=1))
    cancel_account_payable(cancelled)

    payables = dashboard(api_client)["accounts_payable"]

    assert payables["overdue"]["count"] == 0
    assert payables["upcoming"] == []
