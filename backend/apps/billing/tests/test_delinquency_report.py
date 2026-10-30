"""The overdue-boletos report: rows, totals, filters, scoping and the PDF (spec 052, R1-R3, R8)."""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.tests.base import body
from apps.persons.models import Person

from ..models import BillingDocument, CondominiumBillingRules
from ..services.create_billing_document import (
    NewBillingDocument,
    NewBillingDocumentItem,
    create_billing_document,
)
from ..services.build_delinquency_report import ROW_LIMIT, build_delinquency_report

pytestmark = pytest.mark.django_db

REPORT = "billing-document-delinquency"
PDF = "billing-document-delinquency-pdf"


def _due(document: BillingDocument, days_ago: int, **changes: object) -> BillingDocument:
    _ = BillingDocument.objects.filter(pk=document.pk).update(
        due_date=timezone.localdate() - timedelta(days=days_ago), **changes
    )
    document.refresh_from_db()
    return document


def _document_of(condominium: Condominium, payer: Person, days_ago: int, reference_month: date) -> BillingDocument:
    """An overdue document of another condominium of the company, with its own rules, sub-conta and template."""
    _ = CondominiumBillingRules.objects.get_or_create(condominium=condominium)
    cost_center = CostCenter.objects.create(condominium=condominium, name="Taxa")
    template = EntryTemplate.objects.create(cost_center=cost_center, name="REC Taxa")
    unit = Unit.objects.create(condominium=condominium, name="9")
    document = create_billing_document(
        NewBillingDocument(
            unit=unit,
            payer=payer,
            reference_month=reference_month,
            competence_month=reference_month,
            due_date=date(2026, 9, 10),
            items=(NewBillingDocumentItem("Taxa", cost_center, template, Decimal("300.00")),),
        )
    )
    return _due(document, days_ago)


def test_lists_only_documents_awaiting_payment_past_their_due_date(  # type: ignore[no-untyped-def]
    api_client: APIClient, document: BillingDocument, new_document, make_unit
) -> None:
    late = _due(document, 12)
    paid = create_billing_document(new_document(unit=make_unit("202"), reference_month=date(2026, 9, 1), due_date=date(2026, 9, 10)))
    _ = _due(paid, 30, status=BillingDocument.Status.PAID)
    cancelled = create_billing_document(new_document(unit=make_unit("303"), reference_month=date(2026, 8, 1), due_date=date(2026, 8, 10)))
    _ = _due(cancelled, 40, status=BillingDocument.Status.CANCELLED)
    not_due = create_billing_document(new_document(unit=make_unit("404"), reference_month=date(2026, 7, 1), due_date=date(2026, 7, 10)))
    _ = BillingDocument.objects.filter(pk=not_due.pk).update(due_date=timezone.localdate() + timedelta(days=3))

    data = body(api_client.get(reverse(REPORT)))

    assert [row["document_id"] for row in data["rows"]] == [str(late.pk)]
    assert data["count"] == 1
    assert Decimal(data["total_amount"]) == late.amount
    assert data["rows"][0]["days_overdue"] == 12
    assert data["rows"][0]["unit_name"] == "101"
    assert data["rows"][0]["payer_name"] == "Maria Souza"
    assert data["truncated"] is False
    assert data["as_of"] == timezone.localdate().isoformat()


def test_registered_documents_count_and_totals_are_per_condominium(  # type: ignore[no-untyped-def]
    api_client: APIClient, document: BillingDocument, new_document, make_unit, other_condominium: Condominium
) -> None:
    _ = _due(document, 5, status=BillingDocument.Status.REGISTERED)
    second = _document_of(other_condominium, document.payer, 20, date(2026, 9, 1))
    third = create_billing_document(new_document(unit=make_unit("202"), reference_month=date(2026, 8, 1), due_date=date(2026, 8, 10)))
    _ = _due(third, 50)

    data = body(api_client.get(reverse(REPORT)))

    assert data["count"] == 3
    per_condominium = {line["condominium_name"]: (line["count"], Decimal(line["total_amount"])) for line in data["by_condominium"]}
    assert per_condominium[document.unit.condominium.name] == (2, document.amount + third.amount)
    assert per_condominium[other_condominium.name] == (1, second.amount)
    # Ordered by the condominium's code, then the oldest due date first.
    code_of = {document.unit.condominium.name: document.unit.condominium.code, other_condominium.name: other_condominium.code}
    ordered = [(code_of[row["condominium_name"]], row["days_overdue"]) for row in data["rows"]]
    assert ordered == sorted(ordered, key=lambda pair: (pair[0], -pair[1]))
    assert [line["condominium_name"] for line in data["by_condominium"]] == sorted(code_of, key=code_of.get)


def test_filters_by_condominium_and_reference_month(
    api_client: APIClient, document: BillingDocument, other_condominium: Condominium
) -> None:
    _ = _due(document, 5)
    other = _document_of(other_condominium, document.payer, 20, date(2026, 9, 1))

    only_other = body(api_client.get(reverse(REPORT), {"condominium": str(other_condominium.pk)}))
    by_month = body(api_client.get(reverse(REPORT), {"reference_month": "2026-09-01"}))

    assert [row["document_id"] for row in only_other["rows"]] == [str(other.pk)]
    assert [row["document_id"] for row in by_month["rows"]] == [str(other.pk)]
    assert only_other["count"] == 1


def test_another_company_sees_nothing(other_api_client: APIClient, document: BillingDocument) -> None:
    _ = _due(document, 5)

    data = body(other_api_client.get(reverse(REPORT)))

    assert data["count"] == 0
    assert data["rows"] == []
    assert Decimal(data["total_amount"]) == 0


def test_without_overdue_documents_the_report_is_empty(api_client: APIClient, document: BillingDocument) -> None:
    _ = BillingDocument.objects.filter(pk=document.pk).update(due_date=timezone.localdate() + timedelta(days=5))

    data = body(api_client.get(reverse(REPORT)))

    assert data["rows"] == []
    assert data["by_condominium"] == []
    assert data["count"] == 0


def test_rows_are_capped_but_totals_cover_everything(document: BillingDocument, monkeypatch: pytest.MonkeyPatch) -> None:
    _ = _due(document, 5)
    monkeypatch.setattr("apps.billing.services.build_delinquency_report.ROW_LIMIT", 0)

    report = build_delinquency_report(BillingDocument.objects.all(), timezone.localdate())

    assert ROW_LIMIT == 2000
    assert report.rows == []
    assert report.truncated is True
    assert report.count == 1


def _twelve_overdue(document: BillingDocument, new_document, make_unit) -> list[BillingDocument]:  # type: ignore[no-untyped-def]
    """The fixture's document plus eleven more, all overdue (spec 057)."""
    documents = [_due(document, 3)]
    for number in range(11):
        created = create_billing_document(new_document(unit=make_unit(f"3{number:02d}"), reference_month=date(2026, 9, 1), due_date=date(2026, 9, 10)))
        documents.append(_due(created, 4 + number))
    return documents


def test_rows_come_ten_per_page(api_client: APIClient, document: BillingDocument, new_document, make_unit) -> None:  # type: ignore[no-untyped-def]
    documents = _twelve_overdue(document, new_document, make_unit)

    first = body(api_client.get(reverse(REPORT)))
    second = body(api_client.get(reverse(REPORT), {"page": 2}))

    assert (first["page"], first["page_size"], first["page_count"]) == (1, 10, 2)
    assert len(first["rows"]) == 10
    assert len(second["rows"]) == 2
    shown = [row["document_id"] for row in first["rows"] + second["rows"]]
    assert sorted(shown) == sorted(str(item.pk) for item in documents)
    assert len(set(shown)) == 12


def test_totals_cover_every_page_and_a_bad_page_is_refused(  # type: ignore[no-untyped-def]
    api_client: APIClient, document: BillingDocument, new_document, make_unit
) -> None:
    documents = _twelve_overdue(document, new_document, make_unit)

    second = body(api_client.get(reverse(REPORT), {"page": 2}))
    past_the_end = body(api_client.get(reverse(REPORT), {"page": 9}))

    assert second["count"] == past_the_end["count"] == 12
    assert Decimal(second["total_amount"]) == sum((item.amount for item in documents), Decimal(0))
    assert past_the_end["rows"] == []
    for invalid in ("0", "-1", "two"):
        assert api_client.get(reverse(REPORT), {"page": invalid}).status_code == status.HTTP_400_BAD_REQUEST


def test_the_pdf_service_keeps_every_row(document: BillingDocument, new_document, make_unit) -> None:  # type: ignore[no-untyped-def]
    _ = _twelve_overdue(document, new_document, make_unit)

    report = build_delinquency_report(BillingDocument.objects.all(), timezone.localdate())

    assert len(report.rows) == 12
    assert (report.page, report.page_count) == (1, 1)


def test_pdf_is_a_download_with_the_same_filters(api_client: APIClient, document: BillingDocument) -> None:
    _ = _due(document, 5)

    response = api_client.get(reverse(PDF), {"condominium": str(document.unit.condominium_id)})

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"] == "application/pdf"
    assert response["Content-Disposition"].startswith('attachment; filename="inadimplencia-')
    assert response.content.startswith(b"%PDF")


def test_pdf_escapes_the_text_of_the_data(api_client: APIClient, document: BillingDocument) -> None:
    _ = _due(document, 5)
    payer = document.payer
    payer.name = "<script>alert(1)</script>"
    payer.save(update_fields=["name"])

    response = api_client.get(reverse(PDF))

    assert response.status_code == status.HTTP_200_OK
    assert response.content.startswith(b"%PDF")


def test_the_page_size_can_be_asked_and_is_capped(api_client: APIClient, document: BillingDocument, new_document, make_unit) -> None:  # type: ignore[no-untyped-def]
    _ = _twelve_overdue(document, new_document, make_unit)

    big = body(api_client.get(reverse(REPORT), {"page_size": 25}))
    small = body(api_client.get(reverse(REPORT), {"page_size": 5, "page": 3}))

    assert (big["page_size"], big["page_count"], len(big["rows"])) == (25, 1, 12)
    assert (small["page_size"], small["page_count"], len(small["rows"])) == (5, 3, 2)
    for invalid in ("0", "101", "many"):
        assert api_client.get(reverse(REPORT), {"page_size": invalid}).status_code == status.HTTP_400_BAD_REQUEST
