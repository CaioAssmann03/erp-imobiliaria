"""The shared address: it lives in core, has its own company and is stored under the user's (spec 043, R1, R3, R4)."""

import ast
from pathlib import Path

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.models import Address, Company

pytestmark = pytest.mark.django_db

CORE = Path(__file__).resolve().parents[1]
CNPJ = "45723174000110"


def test_the_table_is_named_address() -> None:
    assert Address._meta.db_table == "address"


def test_an_address_needs_a_company() -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = Address.objects.create(city="Curitiba")


def test_an_address_is_only_visible_to_its_own_company(company: Company, other_company: Company, staff_user: User) -> None:
    mine = Address.objects.create(company=company, city="Curitiba")
    _ = Address.objects.create(company=other_company, city="Londrina")

    assert list(scope_to_company(Address.objects.all(), staff_user)) == [mine]


def test_the_address_model_and_serializer_do_not_import_condominiums() -> None:
    for relative in ("models/address.py", "serializers/address_serializers.py"):
        imported = [
            node.module or ""
            for node in ast.walk(ast.parse((CORE / relative).read_text()))
            if isinstance(node, ast.ImportFrom)
        ]
        assert not [module for module in imported if module.startswith("apps.condominiums")], relative


def test_a_condominium_created_with_an_address_stores_it_under_the_users_company(
    api_client: APIClient, company: Company
) -> None:
    response = api_client.post(
        reverse("condominium-list"),
        {"name": "Sol", "cnpj": CNPJ, "address": {"city": "Curitiba", "state": "PR"}},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    address = Address.objects.get()
    assert (address.company, address.city) == (company, "Curitiba")
    assert "company" not in response.data["address"]


def test_an_address_added_on_update_takes_the_company_of_the_condominium(
    api_client: APIClient, company: Company
) -> None:
    condominium = Condominium.objects.create(company=company, name="Sol", cnpj=CNPJ)

    response = api_client.patch(
        reverse("condominium-detail", args=[condominium.pk]), {"address": {"city": "Curitiba"}}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert Address.objects.get().company == condominium.company
