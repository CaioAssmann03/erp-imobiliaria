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

from ..models import CondominiumAdministrationContract, Condominium, Unit, UnitPerson
from .base import add_fraction, results

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


def make_unit(
    condominium: Condominium, name: str, second_fraction: Decimal | None = None, **fields: object
) -> Unit:
    unit = Unit.objects.create(condominium=condominium, name=name, **fields)
    add_fraction(unit, 1)
    if second_fraction is not None:
        add_fraction(unit, second_fraction, position=2)
    return unit


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
    add_fraction(Unit.objects.create(condominium=short, name="101"), "0.5")

    assert condominium_names(api_client, "inconsistent_apportionment") == ["Nao Fecha"]


def test_condominiums_by_adjustment_window(api_client: APIClient, company: Company) -> None:
    late = make_condominium(company, "Atrasado", "11222333000181")
    soon = make_condominium(company, "Em breve", "45723174000110")
    far = make_condominium(company, "Longe", "11444777000161")
    for condominium, days in ((late, -10), (soon, 10), (far, 200)):
        _ = CondominiumAdministrationContract.objects.create(
            condominium=condominium,
            fee_type="fixed",
            fee_amount=Decimal(100),
            adjustment_base_date=today() + timedelta(days=days) - timedelta(days=365),
            adjustment_period_months=12,
        )

    assert condominium_names(api_client, "overdue_adjustment") == ["Atrasado"]
    assert condominium_names(api_client, "upcoming_adjustment") == ["Em breve"]


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
