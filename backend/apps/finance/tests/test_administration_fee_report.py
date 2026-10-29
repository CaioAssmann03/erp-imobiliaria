"""The administration fee report: what each condominium owes the administradora in a month (spec 056, R1, R3–R5, R7)."""

from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, CondominiumAdministrationContract
from apps.core.models import Company

from ..models import CurrentAccountEntry
from ..services.post_entry import post_entry
from .base import body, error_codes

pytestmark = pytest.mark.django_db

REPORT = "current-account-entry-administration-fee"
PDF = "current-account-entry-administration-fee-pdf"
Contract = CondominiumAdministrationContract
CREDIT = CurrentAccountEntry.Kind.CREDIT
DEBIT = CurrentAccountEntry.Kind.DEBIT


@pytest.fixture
def ledger(make_entry):  # type: ignore[no-untyped-def]
    """October: +2000 and -500 of the month, a credit in September and a debit in November that do not count."""
    for entry_date, kind, amount in [
        (date(2026, 9, 30), CREDIT, "999.00"),
        (date(2026, 10, 2), CREDIT, "1500.00"),
        (date(2026, 10, 20), CREDIT, "500.00"),
        (date(2026, 10, 25), DEBIT, "500.00"),
        (date(2026, 11, 1), DEBIT, "70.00"),
    ]:
        _ = post_entry(
            make_entry(entry_date=entry_date, competence_month=entry_date.replace(day=1), kind=kind, amount=Decimal(amount))
        )


def rows_by_name(response) -> dict[str, dict]:  # type: ignore[no-untyped-def, type-arg]
    return {row["condominium_name"]: row for row in body(response)["rows"]}


def test_a_variable_fee_on_revenue_uses_the_months_credits(
    api_client: APIClient, condominium: Condominium, ledger: None
) -> None:
    _ = Contract.objects.create(
        condominium=condominium, fee_type=Contract.FeeType.VARIABLE, fee_percentage=Decimal("10.00"), fee_basis=Contract.FeeBasis.REVENUE
    )

    response = api_client.get(reverse(REPORT), {"month": "2026-10-01"})

    row = rows_by_name(response)[condominium.name]
    assert (Decimal(row["base_amount"]), Decimal(row["fee_due"]), row["status"]) == (Decimal("2000.00"), Decimal("200.00"), "due")
    assert (body(response)["count"], Decimal(body(response)["total_fee"])) == (1, Decimal("200.00"))


def test_a_variable_fee_on_expense_uses_the_months_debits_with_the_floor(
    api_client: APIClient, condominium: Condominium, ledger: None
) -> None:
    _ = Contract.objects.create(
        condominium=condominium,
        fee_type=Contract.FeeType.VARIABLE,
        fee_percentage=Decimal("10.00"),
        fee_basis=Contract.FeeBasis.EXPENSE,
        fee_floor=Decimal("120.00"),
    )

    row = rows_by_name(api_client.get(reverse(REPORT), {"month": "2026-10-01"}))[condominium.name]

    assert (Decimal(row["base_amount"]), Decimal(row["fee_before_limits"]), Decimal(row["fee_due"])) == (
        Decimal("500.00"), Decimal("50.00"), Decimal("120.00")
    )


def test_a_fixed_fee_has_no_base(api_client: APIClient, condominium: Condominium) -> None:
    _ = Contract.objects.create(condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("1500.00"), charges_iss_on_fee=True)

    row = rows_by_name(api_client.get(reverse(REPORT), {"month": "2026-10-01"}))[condominium.name]

    assert (row["base_amount"], Decimal(row["fee_due"]), row["charges_iss_on_fee"]) == (None, Decimal("1500.00"), True)


def test_a_contract_that_starts_later_and_a_missing_contract_are_listed_but_not_counted(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    _ = Contract.objects.create(condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("900.00"), start_date=date(2026, 11, 5))
    bare = Condominium.objects.create(company=company, name="Sem Contrato", cnpj="45723174000110")

    response = api_client.get(reverse(REPORT), {"month": "2026-10-01"})

    rows = rows_by_name(response)
    assert (rows[condominium.name]["status"], rows[bare.name]["status"]) == ("not_started", "no_contract")
    assert (body(response)["count"], Decimal(body(response)["total_fee"])) == (0, Decimal("0"))
    assert Decimal(rows[condominium.name]["fee_due"]) == 0


def test_the_filter_limits_the_report_to_one_condominium_and_an_inactive_one_is_out(
    api_client: APIClient, company: Company, condominium: Condominium, other_condominium: Condominium
) -> None:
    other_condominium.active = False
    other_condominium.save()
    third = Condominium.objects.create(company=company, name="Terceiro", cnpj="07526557000100")

    everything = api_client.get(reverse(REPORT), {"month": "2026-10-01"})
    one = api_client.get(reverse(REPORT), {"month": "2026-10-01", "condominium": str(third.pk)})

    assert set(rows_by_name(everything)) == {condominium.name, third.name}
    assert list(rows_by_name(one)) == [third.name]
    assert api_client.get(reverse(REPORT), {"month": "2026-10-01", "condominium": str(other_condominium.pk)}).status_code == 404


def test_the_month_is_required_and_must_be_a_first_day(api_client: APIClient) -> None:
    missing = api_client.get(reverse(REPORT))
    wrong_day = api_client.get(reverse(REPORT), {"month": "2026-10-15"})

    assert missing.status_code == wrong_day.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(missing, "month") == ["required"]


def test_another_company_sees_nothing_and_cannot_pick_a_condominium(
    other_api_client: APIClient, condominium: Condominium, ledger: None
) -> None:
    _ = Contract.objects.create(condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("1500.00"))

    listed = other_api_client.get(reverse(REPORT), {"month": "2026-10-01"})
    picked = other_api_client.get(reverse(REPORT), {"month": "2026-10-01", "condominium": str(condominium.pk)})

    assert body(listed)["rows"] == []
    assert picked.status_code == 404


def test_the_pdf_has_the_same_filters_and_escapes_the_text(
    api_client: APIClient, condominium: Condominium
) -> None:
    condominium.name = "<script>alert(1)</script> Sol"
    condominium.save()
    _ = Contract.objects.create(condominium=condominium, fee_type=Contract.FeeType.FIXED, fee_amount=Decimal("1500.00"))

    response = api_client.get(reverse(PDF), {"month": "2026-10-01"})

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert "taxa-de-administracao-2026-10.pdf" in response["Content-Disposition"]
