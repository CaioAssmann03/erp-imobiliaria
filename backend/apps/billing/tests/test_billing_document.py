"""Billing documents: months, payer, uniqueness, frozen data and status moves (spec 025, R1, R3, R4, R5)."""

from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.models import Company
from apps.persons.models import Person

from ..models import BillingDocument
from ..services.create_billing_document import create_billing_document

pytestmark = pytest.mark.django_db


def error_codes(error: ValidationError, field: str) -> list[str | None]:
    return [single_error.code for single_error in error.error_dict[field]]


def test_months_are_written_as_their_first_day(document: BillingDocument) -> None:
    document.reference_month = date(2026, 10, 15)

    with pytest.raises(ValidationError) as raised:
        document.full_clean()

    assert error_codes(raised.value, "reference_month") == ["month.not_first_day"]


def test_payer_must_belong_to_the_units_company(new_document, billing_rules, other_company: Company) -> None:  # type: ignore[no-untyped-def]
    stranger = Person.objects.create(company=other_company, name="Fulano")

    with pytest.raises(ValidationError) as raised:
        _ = create_billing_document(new_document(payer=stranger))

    assert error_codes(raised.value, "payer") == ["billing_document.payer.other_company"]


def test_unit_has_one_document_per_reference_month(document: BillingDocument, new_document) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(ValidationError) as raised:
        _ = create_billing_document(new_document())

    assert "billing_document.reference_month.duplicate_for_unit" in [
        error.code for error in raised.value.error_dict["__all__"]
    ]


def test_unique_reference_month_is_refused_by_the_database(document: BillingDocument) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BillingDocument.objects.create(
            unit=document.unit,
            payer=document.payer,
            reference_month=document.reference_month,
            competence_month=document.competence_month,
            due_date=document.due_date,
            amount=Decimal("10.00"),
            interest_calculation=document.interest_calculation,
        )


def test_a_cancelled_document_frees_the_month(document: BillingDocument, new_document) -> None:  # type: ignore[no-untyped-def]
    _ = BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.CANCELLED)

    reissued = create_billing_document(new_document())

    assert reissued.pk != document.pk
    assert reissued.status == BillingDocument.Status.ISSUED


def test_amount_must_be_positive_in_the_database(document: BillingDocument) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BillingDocument.objects.filter(pk=document.pk).update(amount=Decimal(0))


def test_issued_data_cannot_change(document: BillingDocument) -> None:
    document.due_date = date(2026, 10, 20)

    with pytest.raises(ValidationError) as raised:
        document.full_clean()

    assert error_codes(raised.value, "amount") == ["billing_document.data.immutable"]


def test_amount_must_equal_the_sum_of_the_items(document: BillingDocument) -> None:
    _ = BillingDocument.objects.filter(pk=document.pk).update(amount=Decimal("1.00"))
    document.refresh_from_db()

    with pytest.raises(ValidationError) as raised:
        document.full_clean()

    assert error_codes(raised.value, "amount") == ["billing_document.amount.differs_from_items_total"]


@pytest.mark.parametrize(
    ("from_status", "to_status", "is_allowed"),
    [
        ("issued", "registered", True),
        ("issued", "cancelled", True),
        ("registered", "paid", True),
        ("registered", "cancelled", True),
        ("issued", "paid", False),
        ("paid", "cancelled", False),
        ("cancelled", "issued", False),
        ("paid", "registered", False),
    ],
)
def test_status_moves_only_along_the_allowed_transitions(
    document: BillingDocument, from_status: str, to_status: str, is_allowed: bool
) -> None:
    _ = BillingDocument.objects.filter(pk=document.pk).update(status=from_status)
    document.refresh_from_db()
    document.status = to_status

    if is_allowed:
        document.full_clean()
    else:
        with pytest.raises(ValidationError) as raised:
            document.full_clean()
        assert error_codes(raised.value, "status") == ["billing_document.status.transition_not_allowed"]


def test_overdue_is_derived_from_the_due_date_and_the_status(document: BillingDocument) -> None:
    assert not document.is_overdue_on(date(2026, 10, 10))
    assert document.is_overdue_on(date(2026, 10, 11))
    assert list(BillingDocument.objects.overdue_on(date(2026, 10, 11))) == [document]
    assert not BillingDocument.objects.overdue_on(date(2026, 10, 10)).exists()

    _ = BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.PAID)
    document.refresh_from_db()

    assert not document.is_overdue_on(date(2026, 11, 1))
    assert not BillingDocument.objects.overdue_on(date(2026, 11, 1)).exists()
