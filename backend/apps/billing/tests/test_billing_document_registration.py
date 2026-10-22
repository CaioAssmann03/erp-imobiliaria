"""BillingDocumentRegistration: attempts are kept and one is active (spec 031, R6)."""

import pytest
from django.db import IntegrityError, transaction

from ..models import BillingDocument, BillingDocumentRegistration, GatewayAccount

pytestmark = pytest.mark.django_db


def make(document: BillingDocument, account: GatewayAccount, status: str, payment_id: str = "") -> BillingDocumentRegistration:
    return BillingDocumentRegistration.objects.create(
        document=document,
        gateway_account=account,
        status=status,
        registered_due_date=document.due_date,
        gateway_payment_id=payment_id,
    )


@pytest.fixture
def account(document: BillingDocument) -> GatewayAccount:
    return GatewayAccount.objects.create(
        condominium=document.unit.condominium, gateway_account_id="a", wallet_id="w", api_key="k", webhook_token="t"
    )


def test_attempts_are_kept_and_one_is_active(document: BillingDocument, account: GatewayAccount) -> None:
    make(document, account, BillingDocumentRegistration.Status.REPLACED, "pay_1")
    make(document, account, BillingDocumentRegistration.Status.FAILED)
    make(document, account, BillingDocumentRegistration.Status.FAILED)
    make(document, account, BillingDocumentRegistration.Status.ACTIVE, "pay_2")

    with pytest.raises(IntegrityError), transaction.atomic():
        make(document, account, BillingDocumentRegistration.Status.ACTIVE, "pay_3")
    assert document.registrations.count() == 4


def test_a_gateway_charge_belongs_to_one_registration(document: BillingDocument, account: GatewayAccount) -> None:
    make(document, account, BillingDocumentRegistration.Status.REPLACED, "pay_1")

    with pytest.raises(IntegrityError), transaction.atomic():
        make(document, account, BillingDocumentRegistration.Status.ACTIVE, "pay_1")
