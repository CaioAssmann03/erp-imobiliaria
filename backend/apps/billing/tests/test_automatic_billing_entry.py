"""The ledger entry that a billing payment posts: no user, one per document item (spec 032, R9)."""

import datetime

import pytest
from django.core.exceptions import ValidationError

from apps.billing.models import BillingDocument
from apps.finance.models import CurrentAccount, CurrentAccountEntry, EntryBatch

pytestmark = pytest.mark.django_db


@pytest.fixture
def ledger(document: BillingDocument) -> tuple[CurrentAccount, EntryBatch]:
    condominium = document.unit.condominium
    account = CurrentAccount.objects.create(condominium=condominium, company=condominium.company)
    batch = EntryBatch.objects.create(company=condominium.company, batch_date=datetime.date(2026, 10, 20), origin="bank")
    return account, batch


def entry_for(document: BillingDocument, ledger: tuple[CurrentAccount, EntryBatch]) -> CurrentAccountEntry:
    item = document.items.first()
    assert item is not None
    return CurrentAccountEntry.receiving(item, ledger[0], ledger[1], datetime.date(2026, 10, 20))


def test_an_automatic_billing_entry_needs_no_user(document: BillingDocument, ledger: tuple[CurrentAccount, EntryBatch]) -> None:
    entry = entry_for(document, ledger)

    entry.full_clean()
    entry.save()

    assert entry.created_by is None and entry.kind == "credit"


def test_a_manual_entry_still_needs_a_user(document: BillingDocument, ledger: tuple[CurrentAccount, EntryBatch]) -> None:
    entry = entry_for(document, ledger)
    entry.origin = CurrentAccountEntry.Origin.MANUAL
    entry.billing_document_item = None
    entry.justification = "x"

    with pytest.raises(Exception) as raised:  # the database constraint: a manual entry without created_by
        entry.save()

    assert "created_by" in str(raised.value)


def test_an_item_has_at_most_one_entry(document: BillingDocument, ledger: tuple[CurrentAccount, EntryBatch]) -> None:
    entry_for(document, ledger).save()

    with pytest.raises(ValidationError) as raised:
        entry_for(document, ledger).full_clean()

    assert [e.code for e in raised.value.error_dict["billing_document_item"]] == [
        "current_account_entry.billing_document_item.already_posted"
    ]
