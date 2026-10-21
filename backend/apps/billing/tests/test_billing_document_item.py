"""Billing document items: cost center, template and frozen lines (spec 025, R2, R3, R5)."""

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import Condominium
from apps.finance.models import CostCenter, EntryTemplate

from ..models import BillingDocument, BillingDocumentItem

pytestmark = pytest.mark.django_db


def error_codes(error: ValidationError, field: str) -> list[str | None]:
    return [single_error.code for single_error in error.error_dict[field]]


def build_item(document: BillingDocument, cost_center: CostCenter, entry_template: EntryTemplate, position: int = 9) -> BillingDocumentItem:
    return BillingDocumentItem(
        document=document,
        position=position,
        description="Extra",
        cost_center=cost_center,
        entry_template=entry_template,
        amount=Decimal("10.00"),
    )


def test_cost_center_of_another_condominium_is_rejected(
    document: BillingDocument, other_condominium: Condominium
) -> None:
    foreign = CostCenter.objects.create(condominium=other_condominium, name="Outro")
    template = EntryTemplate.objects.create(cost_center=foreign, name="Outro")

    with pytest.raises(ValidationError) as raised:
        build_item(document, foreign, template).full_clean()

    assert error_codes(raised.value, "cost_center") == ["billing_document_item.cost_center.other_condominium"]


def test_entry_template_of_another_cost_center_is_rejected(
    document: BillingDocument, condominium: Condominium, cost_center: CostCenter
) -> None:
    other_cost_center = CostCenter.objects.create(condominium=condominium, name="Fundo")
    foreign_template = EntryTemplate.objects.create(cost_center=other_cost_center, name="REC Fundo")

    with pytest.raises(ValidationError) as raised:
        build_item(document, cost_center, foreign_template).full_clean()

    assert error_codes(raised.value, "entry_template") == ["billing_document_item.entry_template.other_cost_center"]


def test_inactive_cost_center_and_template_are_refused_on_creation_only(
    document: BillingDocument, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    _ = CostCenter.objects.filter(pk=cost_center.pk).update(active=False)
    _ = EntryTemplate.objects.filter(pk=entry_template.pk).update(active=False)
    cost_center.refresh_from_db()
    entry_template.refresh_from_db()

    with pytest.raises(ValidationError) as raised:
        build_item(document, cost_center, entry_template).full_clean()
    stored_item = document.items.first()
    assert stored_item is not None
    stored_item.cost_center = cost_center
    stored_item.entry_template = entry_template
    stored_item.full_clean()

    assert error_codes(raised.value, "cost_center") == ["billing_document_item.cost_center.inactive"]
    assert error_codes(raised.value, "entry_template") == ["billing_document_item.entry_template.inactive"]


def test_a_saved_item_cannot_change(document: BillingDocument) -> None:
    item = document.items.get(position=1)
    item.amount = Decimal("1.00")

    with pytest.raises(ValidationError) as raised:
        item.full_clean()

    assert error_codes(raised.value, "amount") == ["billing_document_item.data.immutable"]


def test_position_is_unique_per_document(document: BillingDocument, cost_center: CostCenter, entry_template: EntryTemplate) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        build_item(document, cost_center, entry_template, position=1).save()


def test_amount_must_be_positive_in_the_database(document: BillingDocument) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = BillingDocumentItem.objects.filter(document=document, position=1).update(amount=Decimal(-1))
