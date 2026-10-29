"""The unit sheet: a unit's data, people, boletos and entries in a period (spec 057, R1–R5, R7)."""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.models import BillingDocument, CondominiumBillingRules
from apps.billing.services.create_billing_document import NewBillingDocument, NewBillingDocumentItem, create_billing_document
from apps.condominiums.models import Condominium, Unit, UnitPerson
from apps.persons.models import Person

from ..models import CurrentAccountEntry, EntryTemplate
from ..services.post_entry import post_entry
from .base import body

pytestmark = pytest.mark.django_db

SHEET = "current-account-entry-unit-sheet"
PDF = "current-account-entry-unit-sheet-pdf"
TODAY = timezone.localdate()
THIS_MONTH = TODAY.replace(day=1)


def months_ago(count: int) -> date:
    year, month = divmod(THIS_MONTH.year * 12 + THIS_MONTH.month - 1 - count, 12)
    return date(year, month + 1, 1)


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101", gas_value=Decimal("12.50"))


@pytest.fixture
def owner(company, unit: Unit) -> Person:  # type: ignore[no-untyped-def]
    person = Person.objects.create(company=company, name="Maria Souza")
    _ = UnitPerson.objects.create(
        unit=unit, person=person, role=UnitPerson.Role.OWNER, ownership_percentage=Decimal("100"), start_date=date(2020, 1, 1)
    )
    return person


@pytest.fixture
def make_document(unit: Unit, owner: Person, cost_center, entry_template: EntryTemplate):  # type: ignore[no-untyped-def]
    _ = CondominiumBillingRules.objects.get_or_create(condominium=unit.condominium)

    def build(reference_month: date, due_date: date, amount: str = "300.00", **overrides: object) -> BillingDocument:
        new = NewBillingDocument(
            unit=unit,
            payer=owner,
            reference_month=reference_month,
            competence_month=reference_month,
            due_date=due_date,
            items=(NewBillingDocumentItem("Taxa", cost_center, entry_template, Decimal(amount)),),
            **overrides,  # type: ignore[arg-type]
        )
        return create_billing_document(new)

    return build


def sheet(api_client: APIClient, unit: Unit, **params: str):  # type: ignore[no-untyped-def]
    return api_client.get(reverse(SHEET), {"unit": str(unit.pk), **params})


def test_the_sheet_has_the_data_the_fractions_and_the_current_people(  # type: ignore[no-untyped-def]
    api_client: APIClient, company, unit: Unit, owner: Person
) -> None:
    tenant = Person.objects.create(company=company, name="João Lima")
    _ = UnitPerson.objects.create(unit=unit, person=tenant, role=UnitPerson.Role.TENANT, start_date=date(2024, 1, 1))
    old = Person.objects.create(company=company, name="Antigo Dono")
    _ = UnitPerson.objects.create(
        unit=unit, person=old, role=UnitPerson.Role.OWNER, ownership_percentage=Decimal("0"), start_date=date(2010, 1, 1), end_date=date(2019, 12, 31)
    )

    data = body(sheet(api_client, unit))

    assert (data["unit_name"], data["condominium_name"], Decimal(data["gas_value"])) == ("101", unit.condominium.name, Decimal("12.50"))
    assert [(person["role"], person["name"]) for person in data["people"]] == [("owner", "Maria Souza"), ("tenant", "João Lima")]


def test_the_boletos_of_the_period_have_totals_and_the_late_ones_say_how_late(  # type: ignore[no-untyped-def]
    api_client: APIClient, unit: Unit, make_document
) -> None:
    paid = make_document(months_ago(3), TODAY - timedelta(days=80), "300.00")
    paid.status = BillingDocument.Status.REGISTERED
    paid.save()
    paid.status = BillingDocument.Status.PAID
    paid.save()
    _ = make_document(months_ago(1), TODAY - timedelta(days=10), "200.00")  # late
    _ = make_document(THIS_MONTH, TODAY + timedelta(days=10), "100.00")  # open, not late
    cancelled = make_document(months_ago(2), TODAY - timedelta(days=40), "50.00")
    cancelled.status = BillingDocument.Status.CANCELLED
    cancelled.save()
    _ = make_document(months_ago(20), TODAY - timedelta(days=600), "999.00")  # out of the period

    data = body(sheet(api_client, unit))

    assert [Decimal(data[key]) for key in ("total_issued", "total_paid", "total_open", "total_overdue")] == [
        Decimal("600.00"), Decimal("300.00"), Decimal("300.00"), Decimal("200.00")
    ]
    assert Decimal(data["total_issued"]) == Decimal(data["total_paid"]) + Decimal(data["total_open"])
    rows = {row["reference_month"]: row for row in data["boletos"]}
    assert len(rows) == 4
    late = rows[months_ago(1).isoformat()]
    assert (late["is_overdue"], late["days_overdue"]) == (True, 10)
    assert rows[months_ago(2).isoformat()]["status"] == "cancelled"
    assert rows[months_ago(3).isoformat()]["status"] == "paid"


def test_an_extra_boleto_is_listed_with_its_kind(api_client: APIClient, unit: Unit, make_document) -> None:  # type: ignore[no-untyped-def]
    _ = make_document(THIS_MONTH, TODAY + timedelta(days=5), "80.00", kind=BillingDocument.Kind.EXTRA)

    data = body(sheet(api_client, unit))

    assert [row["kind"] for row in data["boletos"]] == ["extra"]


def test_the_entries_of_the_unit_in_the_period_have_totals(  # type: ignore[no-untyped-def]
    api_client: APIClient, unit: Unit, make_entry
) -> None:
    for entry_date, kind, amount, entry_unit in [
        (months_ago(1), CurrentAccountEntry.Kind.CREDIT, "300.00", unit),
        (THIS_MONTH, CurrentAccountEntry.Kind.DEBIT, "40.00", unit),
        (THIS_MONTH, CurrentAccountEntry.Kind.CREDIT, "999.00", None),  # no unit: not on the sheet
        (months_ago(20), CurrentAccountEntry.Kind.CREDIT, "888.00", unit),  # out of the period
    ]:
        _ = post_entry(
            make_entry(entry_date=entry_date, competence_month=entry_date.replace(day=1), kind=kind, amount=Decimal(amount), unit=entry_unit)
        )

    data = body(sheet(api_client, unit))

    assert [(row["kind"], row["amount"]) for row in data["entries"]] == [("credit", "300.00"), ("debit", "40.00")]
    assert (Decimal(data["total_credits"]), Decimal(data["total_debits"])) == (Decimal("300.00"), Decimal("40.00"))


def test_the_period_defaults_to_twelve_months_and_can_be_chosen(api_client: APIClient, unit: Unit) -> None:
    default = body(sheet(api_client, unit))
    chosen = body(sheet(api_client, unit, from_month="2026-01-01", to_month="2026-03-01"))

    assert (default["from_month"], default["to_month"]) == (months_ago(11).isoformat(), THIS_MONTH.isoformat())
    assert (chosen["from_month"], chosen["to_month"]) == ("2026-01-01", "2026-03-01")


@pytest.mark.parametrize(
    "params",
    [
        {"from_month": "2026-05-01", "to_month": "2026-03-01"},
        {"from_month": "2020-01-01", "to_month": "2026-03-01"},
        {"from_month": "2026-05-10"},
    ],
)
def test_an_invalid_period_is_refused(api_client: APIClient, unit: Unit, params: dict[str, str]) -> None:
    assert sheet(api_client, unit, **params).status_code == status.HTTP_400_BAD_REQUEST


def test_the_unit_is_required_and_another_companys_unit_is_a_404(
    api_client: APIClient, other_api_client: APIClient, unit: Unit
) -> None:
    assert api_client.get(reverse(SHEET)).status_code == status.HTTP_400_BAD_REQUEST
    assert sheet(other_api_client, unit).status_code == status.HTTP_404_NOT_FOUND
    assert other_api_client.get(reverse(PDF), {"unit": str(unit.pk)}).status_code == status.HTTP_404_NOT_FOUND


def test_the_pdf_is_the_same_sheet(api_client: APIClient, unit: Unit, owner: Person, make_document) -> None:  # type: ignore[no-untyped-def]
    owner.name = "<b>Maria</b>"
    owner.save()
    _ = make_document(THIS_MONTH, TODAY + timedelta(days=5))

    response = api_client.get(reverse(PDF), {"unit": str(unit.pk)})

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert "ficha-" in response["Content-Disposition"] and "101.pdf" in response["Content-Disposition"]
