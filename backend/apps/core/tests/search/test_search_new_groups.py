"""The global search also finds blocks, cost centers, accounts payable, billing plans and billing documents."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.billing.models import BillingPlan
from apps.billing.services.create_billing_document import (
    NewBillingDocument,
    NewBillingDocumentItem,
    create_billing_document,
)
from apps.condominiums.models import BillingRules, Block, Condominium, Unit
from apps.core.models import Company
from apps.finance.models import AccountPayable, CostCenter, EntryTemplate, Supplier
from apps.persons.models import Person

from ..base import JsonObject, body

pytestmark = pytest.mark.django_db


def search(client: APIClient, term: str) -> JsonObject:
    return body(client.get(reverse("search"), {"q": term}))


@pytest.fixture
def condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Residencial Sol", cnpj="11222333000181")


@pytest.fixture
def cost_center(condominium: Condominium) -> CostCenter:
    return CostCenter.objects.create(condominium=condominium, name="Fundo de Reserva")


def test_finds_blocks_and_cost_centers_by_name(api_client: APIClient, condominium: Condominium, cost_center: CostCenter) -> None:
    _ = Block.objects.create(condominium=condominium, name="Torre Norte")

    blocks = search(api_client, "norte")["blocks"]
    cost_centers = search(api_client, "reserva")["cost_centers"]

    assert [(block["name"], block["condominium_name"]) for block in blocks] == [("Torre Norte", "Residencial Sol")]
    assert [(center["name"], center["condominium_name"]) for center in cost_centers] == [("Fundo de Reserva", "Residencial Sol")]


def test_finds_a_billing_plan_by_name(api_client: APIClient, condominium: Condominium) -> None:
    _ = BillingPlan.objects.create(condominium=condominium, name="Taxa ordinária")

    plans = search(api_client, "ordin")["billing_plans"]

    assert [(plan["name"], plan["condominium_name"]) for plan in plans] == [("Taxa ordinária", "Residencial Sol")]


def test_finds_an_account_payable_by_description_document_or_supplier(
    api_client: APIClient, company: Company, condominium: Condominium, cost_center: CostCenter
) -> None:
    supplier = Supplier.objects.create(person=Person.objects.create(company=company, name="Eletrica Brasil Ltda"))
    _ = AccountPayable.objects.create(
        company=company,
        condominium=condominium,
        cost_center=cost_center,
        supplier=supplier,
        description="Troca da fiação do hall",
        document_number="NF-9981",
        amount=Decimal("350.00"),
        due_date=date(2026, 11, 10),
    )

    by_description = search(api_client, "fiação")["accounts_payable"]
    by_document = search(api_client, "NF-9981")["accounts_payable"]
    by_supplier = search(api_client, "eletrica")["accounts_payable"]

    assert [account["description"] for account in by_description] == ["Troca da fiação do hall"]
    assert [account["description"] for account in by_document] == ["Troca da fiação do hall"]
    assert by_supplier[0]["supplier_name"] == "Eletrica Brasil Ltda"
    assert by_supplier[0]["amount"] == "350.00"


def test_finds_a_billing_document_by_payer_or_unit(api_client: APIClient, company: Company, condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="1204")
    payer = Person.objects.create(company=company, name="Beatriz Nogueira")
    _ = BillingRules.objects.create(condominium=condominium)
    center = CostCenter.objects.create(condominium=condominium, name="Taxa")
    template = EntryTemplate.objects.create(cost_center=center, name="REC")
    _ = create_billing_document(
        NewBillingDocument(
            unit=unit,
            payer=payer,
            reference_month=date(2026, 10, 1),
            competence_month=date(2026, 10, 1),
            due_date=date(2026, 10, 10),
            items=(NewBillingDocumentItem("Taxa", center, template, Decimal("500.00")),),
        )
    )

    by_payer = search(api_client, "beatriz")["billing_documents"]
    by_unit = search(api_client, "1204")["billing_documents"]

    assert [(item["payer_name"], item["unit_name"], item["amount"]) for item in by_payer] == [("Beatriz Nogueira", "1204", "500.00")]
    assert [item["unit_name"] for item in by_unit] == ["1204"]
    assert by_payer[0]["status"] == "issued"


def test_a_single_digit_is_only_an_id_lookup(api_client: APIClient, condominium: Condominium, cost_center: CostCenter) -> None:
    _ = Block.objects.create(condominium=condominium, name="Bloco 1")

    results = search(api_client, "1")

    assert results["blocks"] == [] and results["cost_centers"] == []
    assert results["billing_plans"] == [] and results["billing_documents"] == [] and results["accounts_payable"] == []


def test_other_company_does_not_see_these_records(
    other_api_client: APIClient, condominium: Condominium, cost_center: CostCenter
) -> None:
    _ = Block.objects.create(condominium=condominium, name="Torre Norte")
    _ = BillingPlan.objects.create(condominium=condominium, name="Taxa ordinária")

    for term in ("norte", "reserva", "ordin"):
        results = search(other_api_client, term)
        assert results["blocks"] == [] and results["cost_centers"] == [] and results["billing_plans"] == []
