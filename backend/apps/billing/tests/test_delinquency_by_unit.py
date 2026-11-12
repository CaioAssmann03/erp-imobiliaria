"""The delinquency report by unit: a summary per unit, the unit filter, the months on request and the PDF option (spec 072)."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit
from apps.finance.tests.base import body

from ..models import BillingDocument
from ..services.build_delinquency_report import ROW_LIMIT, build_delinquency_report
from ..services.create_billing_document import create_billing_document
from .test_delinquency_report import _document_of, _due

pytestmark = pytest.mark.django_db

REPORT = "billing-document-delinquency"
PDF = "billing-document-delinquency-pdf"


@pytest.fixture
def debts(document: BillingDocument, new_document, make_unit, other_condominium: Condominium) -> dict[str, Unit]:  # type: ignore[no-untyped-def]
    """Unit 101: two months overdue (300 ... 450 each); unit 102: one; another condominium's unit 9: one."""
    first = document
    _ = _due(first, 60)
    second = create_billing_document(new_document(reference_month=date(2026, 9, 1), due_date=date(2026, 9, 10)))
    _ = _due(second, 25)
    unit_102 = make_unit("102")
    third = create_billing_document(new_document(unit=unit_102, reference_month=date(2026, 9, 1), due_date=date(2026, 9, 10)))
    _ = _due(third, 10)
    other = _document_of(other_condominium, document.payer, 90, date(2026, 8, 1))
    return {"101": first.unit, "102": unit_102, "9": other.unit}


def test_there_is_a_line_per_unit_with_its_total_months_and_oldest(api_client: APIClient, debts: dict[str, Unit]) -> None:
    data = body(api_client.get(reverse(REPORT), {"include_months": "false"}))

    lines = {line["unit_name"]: line for line in data["by_unit"]}
    assert set(lines) == {"101", "102", "9"}
    assert (lines["101"]["count"], lines["101"]["days_overdue"]) == (2, 60)
    assert Decimal(lines["101"]["total_amount"]) == Decimal("900.00")
    assert (lines["102"]["count"], lines["102"]["days_overdue"]) == (1, 10)
    assert lines["101"]["payer_name"] == "Maria Souza"
    assert (data["unit_count"], data["units_page"], data["units_page_count"]) == (3, 1, 1)


def test_the_summary_leaves_the_months_out_and_the_default_keeps_them(api_client: APIClient, debts: dict[str, Unit]) -> None:
    summary = body(api_client.get(reverse(REPORT), {"include_months": "false"}))
    full = body(api_client.get(reverse(REPORT)))

    assert summary["rows"] == [] and summary["page_count"] == 1
    assert len(full["rows"]) == 4
    assert (summary["count"], summary["total_amount"]) == (full["count"], full["total_amount"])


def test_the_unit_filter_limits_everything_to_that_unit(api_client: APIClient, debts: dict[str, Unit]) -> None:
    data = body(api_client.get(reverse(REPORT), {"unit": str(debts["101"].pk)}))

    assert [line["unit_name"] for line in data["by_unit"]] == ["101"]
    assert (data["count"], Decimal(data["total_amount"])) == (2, Decimal("900.00"))
    assert {row["reference_month"] for row in data["rows"]} == {"2026-09-01", "2026-10-01"}
    assert [line["condominium_name"] for line in data["by_condominium"]] == [debts["101"].condominium.name]


def test_the_unit_and_the_condominium_and_month_filters_work_together(api_client: APIClient, debts: dict[str, Unit]) -> None:
    unit = str(debts["101"].pk)

    one_month = body(api_client.get(reverse(REPORT), {"unit": unit, "reference_month": "2026-09-01"}))
    wrong_condominium = body(api_client.get(reverse(REPORT), {"unit": unit, "condominium": str(debts["9"].condominium_id)}))

    assert [(line["unit_name"], line["count"]) for line in one_month["by_unit"]] == [("101", 1)]
    assert wrong_condominium["by_unit"] == [] and wrong_condominium["count"] == 0


def test_units_come_by_condominium_by_amount_or_oldest(api_client: APIClient, debts: dict[str, Unit]) -> None:
    def names(order: str) -> list[str]:
        return [line["unit_name"] for line in body(api_client.get(reverse(REPORT), {"units_order": order}))["by_unit"]]

    assert names("condominium")[:2] == ["101", "102"]  # the main condominium first (its code is the smallest), then by name
    assert names("amount")[0] == "101"  # 900.00
    assert names("oldest")[0] == "9"  # 90 days


def test_the_units_are_paged_like_the_rows(api_client: APIClient, debts: dict[str, Unit]) -> None:
    first = body(api_client.get(reverse(REPORT), {"page_size": 2}))
    second = body(api_client.get(reverse(REPORT), {"page_size": 2, "units_page": 2}))

    assert (first["unit_count"], first["units_page_count"]) == (3, 2)
    assert (len(first["by_unit"]), len(second["by_unit"])) == (2, 1)
    assert {line["unit_id"] for line in first["by_unit"] + second["by_unit"]} == {str(unit.pk) for unit in debts.values()}
    assert body(api_client.get(reverse(REPORT), {"units_page": 9}))["by_unit"] == []


def test_a_bad_order_or_page_is_refused(api_client: APIClient, debts: dict[str, Unit]) -> None:
    for params in ({"units_order": "random"}, {"units_page": 0}, {"include_months": "maybe"}):
        assert api_client.get(reverse(REPORT), params).status_code == status.HTTP_400_BAD_REQUEST


def test_another_companys_unit_gives_an_empty_report(other_api_client: APIClient, debts: dict[str, Unit]) -> None:
    data = body(other_api_client.get(reverse(REPORT), {"unit": str(debts["101"].pk)}))

    assert (data["count"], data["by_unit"], data["rows"]) == (0, [], [])


def test_the_pdf_service_keeps_the_whole_summary_and_can_drop_the_months(document: BillingDocument, debts: dict[str, Unit]) -> None:
    documents = BillingDocument.objects.all()

    with_months = build_delinquency_report(documents, date(2026, 11, 12))
    without = build_delinquency_report(documents, date(2026, 11, 12), include_months=False)

    assert len(with_months.by_unit) == without.unit_count == 3 and ROW_LIMIT > 3
    assert len(with_months.rows) == 4 and without.rows == []


def test_the_pdf_follows_the_filters_and_the_months_option(api_client: APIClient, debts: dict[str, Unit]) -> None:
    summary = api_client.get(reverse(PDF), {"unit": str(debts["101"].pk), "include_months": "false"})
    months = api_client.get(reverse(PDF), {"unit": str(debts["101"].pk)})

    assert summary.status_code == months.status_code == status.HTTP_200_OK
    assert summary.content.startswith(b"%PDF") and months.content.startswith(b"%PDF")
    assert api_client.get(reverse(PDF), {"include_months": "maybe"}).status_code == status.HTTP_400_BAD_REQUEST
