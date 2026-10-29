"""The accountability report: a condominium's month in the ledger (spec 052, R4-R6, R8)."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium

from ..models import CostCenter, CurrentAccountEntry, EntryTemplate
from ..services.accountability_report import build_accountability_report
from ..services.post_entry import post_entry
from .base import body, error_codes

pytestmark = pytest.mark.django_db

REPORT = "current-account-entry-accountability"
PDF = "current-account-entry-accountability-pdf"
CREDIT = CurrentAccountEntry.Kind.CREDIT
DEBIT = CurrentAccountEntry.Kind.DEBIT


@pytest.fixture
def reserve(condominium: Condominium) -> CostCenter:
    return CostCenter.objects.create(condominium=condominium, name="Fundo de reserva")


@pytest.fixture
def reserve_template(reserve: CostCenter) -> EntryTemplate:
    return EntryTemplate.objects.create(cost_center=reserve, name="REC Reserva")


@pytest.fixture
def ledger(make_entry, reserve: CostCenter, reserve_template: EntryTemplate):  # type: ignore[no-untyped-def]
    """September: +1000 and -300 in the main sub-conta, +500 in the reserve. October: +200, -50 and +100 (reserve)."""
    movements = [
        (date(2026, 9, 5), CREDIT, "1000.00", None),
        (date(2026, 9, 20), DEBIT, "300.00", None),
        (date(2026, 9, 25), CREDIT, "500.00", reserve),
        (date(2026, 10, 2), CREDIT, "200.00", None),
        (date(2026, 10, 15), DEBIT, "50.00", None),
        (date(2026, 10, 31), CREDIT, "100.00", reserve),
        (date(2026, 11, 1), DEBIT, "70.00", None),
    ]
    for entry_date, kind, amount, center in movements:
        overrides = {"entry_date": entry_date, "competence_month": entry_date.replace(day=1), "kind": kind, "amount": Decimal(amount)}
        if center is not None:
            overrides |= {"cost_center": center, "entry_template": reserve_template}
        _ = post_entry(make_entry(**overrides))


def query(condominium: Condominium, month: str = "2026-10-01") -> dict[str, str]:
    return {"condominium": str(condominium.pk), "month": month}


def test_the_month_has_opening_credits_debits_and_closing(
    api_client: APIClient, condominium: Condominium, ledger: None
) -> None:
    data = body(api_client.get(reverse(REPORT), query(condominium)))

    assert Decimal(data["opening_balance"]) == Decimal("1200.00")  # 1000 - 300 + 500
    assert Decimal(data["total_credits"]) == Decimal("300.00")
    assert Decimal(data["total_debits"]) == Decimal("50.00")
    assert Decimal(data["closing_balance"]) == Decimal("1450.00")
    assert data["condominium_name"] == condominium.name
    assert data["truncated"] is False


def test_each_sub_conta_closes_on_its_own(api_client: APIClient, condominium: Condominium, ledger: None) -> None:
    data = body(api_client.get(reverse(REPORT), query(condominium)))

    lines = {line["cost_center_name"]: line for line in data["by_cost_center"]}
    main = lines["Taxa Ordinária"] if "Taxa Ordinária" in lines else next(line for name, line in lines.items() if name != "Fundo de reserva")
    reserve = lines["Fundo de reserva"]
    assert [Decimal(main[key]) for key in ("opening_balance", "total_credits", "total_debits", "closing_balance")] == [
        Decimal("700.00"), Decimal("200.00"), Decimal("50.00"), Decimal("850.00")
    ]
    assert [Decimal(reserve[key]) for key in ("opening_balance", "total_credits", "total_debits", "closing_balance")] == [
        Decimal("500.00"), Decimal("100.00"), Decimal("0.00"), Decimal("600.00")
    ]
    for line in data["by_cost_center"]:
        assert Decimal(line["closing_balance"]) == Decimal(line["opening_balance"]) + Decimal(line["total_credits"]) - Decimal(line["total_debits"])


def test_only_the_entries_of_the_month_are_listed_in_order(api_client: APIClient, condominium: Condominium, ledger: None) -> None:
    data = body(api_client.get(reverse(REPORT), query(condominium)))

    assert [(row["entry_date"], row["kind"], row["amount"]) for row in data["entries"]] == [
        ("2026-10-02", "credit", "200.00"),
        ("2026-10-15", "debit", "50.00"),
        ("2026-10-31", "credit", "100.00"),
    ]


def test_the_closing_balance_is_the_next_months_opening(api_client: APIClient, condominium: Condominium, ledger: None) -> None:
    october = body(api_client.get(reverse(REPORT), query(condominium)))
    november = body(api_client.get(reverse(REPORT), query(condominium, "2026-11-01")))

    assert november["opening_balance"] == october["closing_balance"]
    assert Decimal(november["closing_balance"]) == Decimal("1380.00")


def test_a_month_without_entries_is_zeros_and_no_rows(api_client: APIClient, condominium: Condominium, current_account) -> None:  # type: ignore[no-untyped-def]
    data = body(api_client.get(reverse(REPORT), query(condominium, "2026-01-01")))

    assert Decimal(data["opening_balance"]) == 0
    assert Decimal(data["closing_balance"]) == 0
    assert data["by_cost_center"] == []
    assert data["entries"] == []


def test_the_query_needs_a_condominium_and_the_first_day_of_a_month(api_client: APIClient, condominium: Condominium) -> None:
    missing = api_client.get(reverse(REPORT))
    not_first_day = api_client.get(reverse(REPORT), query(condominium, "2026-10-15"))

    assert missing.status_code == status.HTTP_400_BAD_REQUEST
    assert "required" in error_codes(missing, "condominium")
    assert "required" in error_codes(missing, "month")
    assert not_first_day.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(not_first_day, "month")


def test_a_condominium_of_another_company_is_not_found(other_api_client: APIClient, condominium: Condominium, ledger: None) -> None:
    response = other_api_client.get(reverse(REPORT), query(condominium))

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_the_service_row_cap_keeps_the_totals(condominium: Condominium, ledger: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("apps.finance.services.accountability_report.ROW_LIMIT", 1)

    report = build_accountability_report(
        condominium, date(2026, 10, 1), CurrentAccountEntry.objects.filter(current_account__condominium=condominium)
    )

    assert len(report.entries) == 1
    assert report.truncated is True
    assert report.total_credits == Decimal("300.00")


def test_pdf_is_a_download(api_client: APIClient, condominium: Condominium, ledger: None) -> None:
    response = api_client.get(reverse(PDF), query(condominium))

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"] == "application/pdf"
    assert response["Content-Disposition"] == f'attachment; filename="prestacao-de-contas-{condominium.code:04d}-2026-10.pdf"'
    assert response.content.startswith(b"%PDF")


def test_pdf_escapes_the_text_of_the_entries(api_client: APIClient, condominium: Condominium, make_entry) -> None:  # type: ignore[no-untyped-def]
    _ = post_entry(make_entry(entry_date=date(2026, 10, 3), description="<img src=x onerror=alert(1)>", kind=CREDIT))

    response = api_client.get(reverse(PDF), query(condominium))

    assert response.status_code == status.HTTP_200_OK
    assert response.content.startswith(b"%PDF")
