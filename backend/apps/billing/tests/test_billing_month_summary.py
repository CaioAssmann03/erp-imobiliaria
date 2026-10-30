"""The boletos per reference month for the dashboard: totals, empty months, the months parameter, scoping (spec 056)."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.finance.tests.base import body

from ..models import BillingDocument
from ..services.build_billing_month_summary import build_billing_month_summary
from ..services.create_billing_document import create_billing_document
from .test_delinquency_report import _document_of

pytestmark = pytest.mark.django_db

SUMMARY = "billing-document-summary"


def _month(months_ago: int) -> date:
    today = timezone.localdate()
    index = today.year * 12 + today.month - 1 - months_ago
    return date(index // 12, index % 12 + 1, 1)


def _document_in(new_document, make_unit, name: str, months_ago: int, **changes: object) -> BillingDocument:  # type: ignore[no-untyped-def]
    month = _month(months_ago)
    document = create_billing_document(new_document(unit=make_unit(name), reference_month=month, competence_month=month, due_date=month))
    if changes:
        _ = BillingDocument.objects.filter(pk=document.pk).update(**changes)
        document.refresh_from_db()
    return document


def test_sums_issued_paid_and_open_per_month_and_skips_cancelled(  # type: ignore[no-untyped-def]
    api_client: APIClient, billing_rules, new_document, make_unit
) -> None:
    paid = _document_in(new_document, make_unit, "201", 0, status=BillingDocument.Status.PAID)
    registered = _document_in(new_document, make_unit, "202", 0, status=BillingDocument.Status.REGISTERED)
    issued = _document_in(new_document, make_unit, "203", 0)
    _ = _document_in(new_document, make_unit, "204", 0, status=BillingDocument.Status.CANCELLED)
    older = _document_in(new_document, make_unit, "205", 2, status=BillingDocument.Status.PAID)

    lines = body(api_client.get(reverse(SUMMARY)))

    assert len(lines) == 6
    assert [line["reference_month"] for line in lines] == [_month(5 - index).isoformat() for index in range(6)]
    current = lines[-1]
    assert (current["paid_count"], Decimal(current["paid_total"])) == (1, paid.amount)
    assert (current["open_count"], Decimal(current["open_total"])) == (2, registered.amount + issued.amount)
    assert (current["issued_count"], Decimal(current["issued_total"])) == (3, paid.amount + registered.amount + issued.amount)
    two_months_ago = lines[3]
    assert (two_months_ago["paid_count"], Decimal(two_months_ago["paid_total"]), two_months_ago["open_count"]) == (1, older.amount, 0)


def test_fills_empty_months_and_validates_the_months_parameter(api_client: APIClient, billing_rules) -> None:  # type: ignore[no-untyped-def]
    three = body(api_client.get(reverse(SUMMARY), {"months": 3}))

    assert [line["reference_month"] for line in three] == [_month(2).isoformat(), _month(1).isoformat(), _month(0).isoformat()]
    assert all(line["issued_count"] == 0 and Decimal(line["issued_total"]) == 0 for line in three)
    for invalid in ("0", "13", "many"):
        assert api_client.get(reverse(SUMMARY), {"months": invalid}).status_code == status.HTTP_400_BAD_REQUEST


def test_filters_by_condominium_and_ignores_other_companies(  # type: ignore[no-untyped-def]
    api_client: APIClient, other_api_client: APIClient, document: BillingDocument, other_condominium: Condominium
) -> None:
    month = _month(0)
    _ = BillingDocument.objects.filter(pk=document.pk).update(reference_month=month, competence_month=month)
    other = _document_of(other_condominium, document.payer, 5, month)

    everything = body(api_client.get(reverse(SUMMARY)))[-1]
    only_other = body(api_client.get(reverse(SUMMARY), {"condominium": str(other_condominium.pk)}))[-1]
    foreign = body(other_api_client.get(reverse(SUMMARY)))[-1]

    assert everything["open_count"] == 2
    assert (only_other["open_count"], Decimal(only_other["open_total"])) == (1, other.amount)
    assert foreign["issued_count"] == 0


def test_service_returns_zeros_for_a_month_without_boletos(db) -> None:  # type: ignore[no-untyped-def]
    lines = build_billing_month_summary(BillingDocument.objects.none(), 2, date(2026, 1, 15))

    assert [line.reference_month for line in lines] == [date(2025, 12, 1), date(2026, 1, 1)]
    assert all(line.issued_count == 0 and line.issued_total == Decimal("0.00") for line in lines)
