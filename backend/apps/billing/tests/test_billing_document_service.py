"""Issuing a billing document: sum, copied terms, order and all-or-none (spec 025, R1, R2)."""

from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.condominiums.models import BillingRules, Condominium, LateInterestRate
from apps.finance.models import CostCenter, EntryTemplate

from ..models import BillingDocument, BillingDocumentItem
from ..services.cancel_billing_document import cancel_billing_document
from ..services.create_billing_document import (
    NewBillingDocumentItem,
    create_billing_document,
)

pytestmark = pytest.mark.django_db


def test_the_amount_is_the_sum_of_the_items_in_their_order(document: BillingDocument) -> None:
    items = list(document.items.all())

    assert document.amount == Decimal("450.00")
    assert document.status == BillingDocument.Status.ISSUED
    assert [(item.position, item.description) for item in items] == [
        (1, "Taxa condominial"),
        (2, "Fundo de reserva"),
    ]


def test_the_terms_are_copied_from_the_rules_at_issuance(document: BillingDocument, billing_rules: BillingRules) -> None:
    billing_rules.late_fee_percentage = Decimal("1.00")
    billing_rules.save()

    document.refresh_from_db()

    assert document.discount_percentage == Decimal("5.00")
    assert document.discount_days == 3
    assert document.late_fee_percentage == Decimal("2.00")
    assert document.interest_grace_days == 1
    assert document.monthly_interest_percentage == Decimal("1.00")


def test_the_interest_rate_is_the_one_in_force_on_the_due_date(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: BillingRules, new_document
) -> None:
    _ = LateInterestRate.objects.create(
        condominium=condominium, start_date=date(2026, 10, 5), monthly_percentage=Decimal("1.50")
    )

    document = create_billing_document(new_document())

    assert document.monthly_interest_percentage == Decimal("1.50")


def test_no_interest_rate_in_force_means_no_interest(  # type: ignore[no-untyped-def]
    condominium: Condominium, billing_rules: BillingRules, new_document
) -> None:
    _ = condominium.late_interest_rates.all().delete()

    document = create_billing_document(new_document())

    assert document.monthly_interest_percentage == Decimal(0)


def test_an_invalid_item_saves_nothing(  # type: ignore[no-untyped-def]
    billing_rules: BillingRules, new_document, other_condominium: Condominium
) -> None:
    foreign_cost_center = CostCenter.objects.create(condominium=other_condominium, name="Outro")
    foreign_template = EntryTemplate.objects.create(cost_center=foreign_cost_center, name="Outro")
    base = new_document()
    bad_item = NewBillingDocumentItem("Alheio", foreign_cost_center, foreign_template, Decimal("10.00"))

    with pytest.raises(ValidationError):
        _ = create_billing_document(new_document(items=(*base.items, bad_item)))

    assert not BillingDocument.objects.exists()
    assert not BillingDocumentItem.objects.exists()


def test_a_document_without_items_is_refused(billing_rules: BillingRules, new_document) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(ValidationError):
        _ = create_billing_document(new_document(items=()))

    assert not BillingDocument.objects.exists()


def test_cancel_moves_the_status_and_refuses_a_paid_document(document: BillingDocument) -> None:
    cancelled = cancel_billing_document(document)

    assert cancelled.status == BillingDocument.Status.CANCELLED

    _ = BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.PAID)
    with pytest.raises(ValidationError):
        _ = cancel_billing_document(document)
