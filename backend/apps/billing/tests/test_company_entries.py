"""The administradora's own ledger: read-only API, filters, balance and scoping (spec 038)."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Company
from apps.finance.models import CompanyEntry
from apps.finance.tests.base import body, results

from apps.condominiums.models import Condominium

from ..models import BillingDocument, BillingDocumentItem

pytestmark = pytest.mark.django_db


@pytest.fixture
def fee_item(document: BillingDocument) -> BillingDocumentItem:
    """A fee line added to an issued document (the model rules do not stop a test from building one)."""
    return BillingDocumentItem.objects.create(
        document=document, position=9, description="0005-TARIFA BANCO", amount=Decimal("3.90"), credits_company=True
    )


def test_list_filter_and_balance(api_client: APIClient, fee_item: BillingDocumentItem) -> None:
    company = fee_item.document.unit.condominium.company
    _ = CompanyEntry.objects.create(
        company=company, billing_document_item=fee_item, entry_date=date(2026, 10, 20), amount=Decimal("3.90"), description="x"
    )

    listed = results(api_client.get(reverse("company-entry-list")))
    in_window = api_client.get(reverse("company-entry-balance"), {"entry_date__gte": "2026-10-01", "entry_date__lte": "2026-10-31"})
    elsewhere = api_client.get(reverse("company-entry-balance"), {"entry_date__gte": "2026-11-01"})

    assert [(row["amount"], row["unit_name"]) for row in listed] == [("3.90", fee_item.document.unit.name)]
    assert body(in_window)["balance"] == Decimal("3.90")
    assert body(elsewhere)["balance"] == 0


def test_another_company_sees_nothing(api_client: APIClient, other_company: Company, fee_item: BillingDocumentItem) -> None:
    _ = CompanyEntry.objects.create(
        company=fee_item.document.unit.condominium.company,
        billing_document_item=fee_item,
        entry_date=date(2026, 10, 20),
        amount=Decimal("3.90"),
        description="x",
    )
    foreign = APIClient()
    foreign.force_authenticate(user=User.objects.create_user(username="other", password="x", company=other_company))

    assert results(foreign.get(reverse("company-entry-list"))) == []
    assert foreign.get(reverse("company-entry-balance")).data["balance"] == 0


def test_filter_by_condominium(api_client: APIClient, fee_item: BillingDocumentItem, other_condominium: Condominium) -> None:
    condominium = fee_item.document.unit.condominium
    _ = CompanyEntry.objects.create(
        company=condominium.company, billing_document_item=fee_item, entry_date=date(2026, 10, 20), amount=Decimal("3.90"), description="x"
    )

    of_the_document = results(api_client.get(reverse("company-entry-list"), {"condominium": str(condominium.pk)}))
    of_another = results(api_client.get(reverse("company-entry-list"), {"condominium": str(other_condominium.pk)}))

    assert len(of_the_document) == 1
    assert of_another == []
