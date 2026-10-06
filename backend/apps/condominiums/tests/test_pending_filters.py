"""`?pending=` on condominiums and units: the dashboard's pendencies (spec 013)."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company
from apps.finance.models import CostCenter
from apps.persons.models import Person

from ..models import AdministrationContract, Condominium, Unit, UnitPerson
from .base import body, results

pytestmark = pytest.mark.django_db

today = timezone.localdate


def condominium_names(client: APIClient, pending: str) -> list[str]:
    response = client.get(reverse("condominium-list"), {"pending": pending})
    assert response.status_code == status.HTTP_200_OK
    return sorted(item["name"] for item in results(response))


def unit_names(client: APIClient, pending: str) -> list[str]:
    response = client.get(reverse("unit-list"), {"pending": pending})
    assert response.status_code == status.HTTP_200_OK
    return sorted(item["name"] for item in results(response))


def make_condominium(company: Company, name: str, cnpj: str, **fields: object) -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj, **fields)


def make_unit(condominium: Condominium, name: str, **fields: object) -> Unit:
    return Unit.objects.create(
        condominium=condominium, name=name, ideal_fraction=Decimal("1"), **fields
    )




def test_condominiums_without_cost_centers(api_client: APIClient, company: Company) -> None:
    with_center = make_condominium(company, "Com Sub-conta", "11222333000181")
    CostCenter.objects.create(condominium=with_center, name="Geral")
    _ = make_condominium(company, "Sem Sub-conta", "45723174000110")
    _ = make_condominium(company, "Inativo", "11444777000161", active=False)

    assert condominium_names(api_client, "without_cost_centers") == ["Sem Sub-conta"]


def test_condominiums_with_inconsistent_apportionment(api_client: APIClient, company: Company) -> None:
    exact = make_condominium(company, "Fecha", "11222333000181")
    make_unit(exact, "101")
    short = make_condominium(company, "Nao Fecha", "45723174000110")
    _ = Unit.objects.create(condominium=short, name="101", ideal_fraction=Decimal("0.5"))

    assert condominium_names(api_client, "inconsistent_apportionment") == ["Nao Fecha"]


def test_condominiums_by_adjustment_window(api_client: APIClient, company: Company) -> None:
    late = make_condominium(company, "Atrasado", "11222333000181")
    soon = make_condominium(company, "Em breve", "45723174000110")
    far = make_condominium(company, "Longe", "11444777000161")
    for condominium, days in ((late, -10), (soon, 10), (far, 200)):
        _ = AdministrationContract.objects.create(
            condominium=condominium,
            fee_type="fixed",
            fee_amount=Decimal("100"),
            adjustment_base_date=today() + timedelta(days=days) - timedelta(days=365),
            adjustment_period_months=12,
        )

    assert condominium_names(api_client, "overdue_adjustment") == ["Atrasado"]
    assert condominium_names(api_client, "upcoming_adjustment") == ["Em breve"]


def test_condominium_pending_rejects_unknown_choice(api_client: APIClient) -> None:
    response = api_client.get(reverse("condominium-list"), {"pending": "nonsense"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST




def test_units_without_responsible(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "Sol", "11222333000181")
    with_owner = make_unit(condominium, "101")
    _ = make_unit(condominium, "102")
    _ = make_unit(condominium, "103", active=False)
    person = Person.objects.create(company=company, name="Maria")
    UnitPerson.objects.create(
        unit=with_owner,
        person=person,
        role="owner",
        ownership_percentage=Decimal("100"),
        start_date=today() - timedelta(days=30),
    )

    assert unit_names(api_client, "without_responsible") == ["102"]


def test_units_with_lease_ending(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "Sol", "11222333000181")
    ending = make_unit(condominium, "101")
    long_lease = make_unit(condominium, "102")
    person = Person.objects.create(company=company, name="Joao")
    for unit, days in ((ending, 20), (long_lease, 300)):
        UnitPerson.objects.create(
            unit=unit,
            person=person,
            role="tenant",
            start_date=today() - timedelta(days=100),
            end_date=today() + timedelta(days=days),
        )

    assert unit_names(api_client, "lease_ending") == ["101"]


def test_units_with_billing_blocked_counts_active_only(api_client: APIClient, company: Company) -> None:
    condominium = make_condominium(company, "Sol", "11222333000181")
    _ = make_unit(condominium, "101", is_billing_blocked=True)
    _ = make_unit(condominium, "102", is_billing_blocked=True, active=False)
    _ = make_unit(condominium, "103")

    assert unit_names(api_client, "billing_blocked") == ["101"]


def test_pending_filters_stay_inside_the_company(
    api_client: APIClient, other_company: Company
) -> None:
    _ = make_condominium(other_company, "De Outra", "11222333000181")

    assert condominium_names(api_client, "without_cost_centers") == []
    assert body(api_client.get(reverse("unit-list"), {"pending": "without_responsible"}))["count"] == 0
