"""Reissuing a registered document, and the gateway's cancellation and refund events (spec 034, R1–R8)."""

from datetime import date, timedelta
from typing import Any

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.errors import BillingDocumentRegistrationError, GatewayAccountError
from apps.billing.gateway.asaas_client import GatewayError, GatewayUnavailable
from apps.finance.tests.base import body, error_codes
from apps.persons.models import PeopleIndividual

from ..models import BillingDocument, BillingDocumentRegistration, GatewayAccount, GatewayEvent
from ..services.process_gateway_event import process_gateway_event
from ..services.reissue_billing_document import reissue_billing_document
from .test_register_billing_document import FakeChargeGateway

pytestmark = pytest.mark.django_db

Status = BillingDocumentRegistration.Status


class FakeReissueGateway(FakeChargeGateway):
    def __init__(self) -> None:
        super().__init__()
        self.deleted: list[str] = []
        self.delete_failure: GatewayError | None = None

    def delete_payment(self, payment_id: str) -> dict[str, Any]:
        if self.delete_failure:
            raise self.delete_failure
        self.deleted.append(payment_id)
        return {"deleted": True}


@pytest.fixture
def account(document: BillingDocument) -> GatewayAccount:
    return GatewayAccount.objects.create(
        condominium=document.unit.condominium,
        gateway_account_id="acc-1",
        wallet_id="w",
        api_key="k",
        webhook_token="t",
        status=GatewayAccount.Status.ACTIVE,
    )


@pytest.fixture(autouse=True)
def payer_with_cpf(document: BillingDocument) -> None:
    _ = PeopleIndividual.objects.create(person=document.payer, company=document.payer.company, cpf="52998224725")


@pytest.fixture
def registered(document: BillingDocument, account: GatewayAccount) -> BillingDocumentRegistration:
    registration = BillingDocumentRegistration.objects.create(
        document=document, gateway_account=account, registered_due_date=document.due_date, gateway_payment_id="pay_old"
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()
    return registration


def tomorrow() -> date:
    return timezone.localdate() + timedelta(days=1)


# ----- the reissue -----


def test_a_reissue_replaces_the_registration_and_cancels_the_old_charge(
    document: BillingDocument, registered: BillingDocumentRegistration
) -> None:
    gateway = FakeReissueGateway()
    gateway.payment_id = "pay_new"

    new = reissue_billing_document(document, tomorrow(), gateway)

    registered.refresh_from_db()
    document.refresh_from_db()
    assert registered.status == Status.REPLACED
    assert (new.status, new.reason, new.registered_due_date) == (Status.ACTIVE, "reissue", tomorrow())
    assert gateway.created_payments[0]["dueDate"] == tomorrow().isoformat()
    assert gateway.created_payments[0]["externalReference"] == f"{document.pk}:1"
    assert gateway.deleted == ["pay_old"]
    assert document.status == BillingDocument.Status.REGISTERED
    assert document.registrations.count() == 2  # nothing is deleted


def test_a_cancelled_registration_can_be_reissued_without_cancelling_anything(
    document: BillingDocument, registered: BillingDocumentRegistration
) -> None:
    BillingDocumentRegistration.objects.filter(pk=registered.pk).update(status=Status.CANCELLED)
    gateway = FakeReissueGateway()
    gateway.payment_id = "pay_new"

    _ = reissue_billing_document(document, tomorrow(), gateway)

    assert gateway.deleted == []
    registered.refresh_from_db()
    assert registered.status == Status.REPLACED


def test_a_failure_to_cancel_the_old_charge_is_recorded(
    document: BillingDocument, registered: BillingDocumentRegistration
) -> None:
    gateway = FakeReissueGateway()
    gateway.payment_id = "pay_new"
    gateway.delete_failure = GatewayUnavailable("timeout")

    new = reissue_billing_document(document, tomorrow(), gateway)

    registered.refresh_from_db()
    assert new.status == Status.ACTIVE
    assert "old_charge_not_cancelled" in registered.error_codes


def test_a_refused_new_charge_keeps_the_current_registration(
    document: BillingDocument, registered: BillingDocumentRegistration
) -> None:
    gateway = FakeReissueGateway()
    gateway.payment_failure = GatewayError(GatewayAccountError.GATEWAY_REJECTED, codes=("invalid_dueDate",))

    attempt = reissue_billing_document(document, tomorrow(), gateway)

    registered.refresh_from_db()
    assert (attempt.status, attempt.reason) == (Status.FAILED, "reissue")
    assert registered.status == Status.ACTIVE and gateway.deleted == []


def test_a_gateway_outage_changes_nothing(document: BillingDocument, registered: BillingDocumentRegistration) -> None:
    gateway = FakeReissueGateway()
    gateway.details_failure = GatewayUnavailable("timeout")

    with pytest.raises(GatewayUnavailable):
        _ = reissue_billing_document(document, tomorrow(), gateway)

    registered.refresh_from_db()
    assert registered.status == Status.ACTIVE and document.registrations.count() == 1


@pytest.mark.parametrize("case", ["issued", "paid", "no_registration", "past_date"])
def test_the_reissue_is_refused(document: BillingDocument, registered: BillingDocumentRegistration, case: str) -> None:
    due = tomorrow()
    if case == "issued":
        BillingDocument.objects.filter(pk=document.pk).update(status="issued")
        expected = BillingDocumentRegistrationError.DOCUMENT_NOT_REGISTERED
    elif case == "paid":
        BillingDocument.objects.filter(pk=document.pk).update(status="paid")
        expected = BillingDocumentRegistrationError.DOCUMENT_NOT_REGISTERED
    elif case == "no_registration":
        BillingDocumentRegistration.objects.filter(pk=registered.pk).update(status=Status.FAILED)
        expected = BillingDocumentRegistrationError.NOTHING_TO_REISSUE
    else:
        due = timezone.localdate() - timedelta(days=1)
        expected = None
    document.refresh_from_db()

    if expected is None:
        from django.core.exceptions import ValidationError

        with pytest.raises(ValidationError) as past:
            _ = reissue_billing_document(document, due, FakeReissueGateway())
        assert [e.code for e in past.value.error_dict["registered_due_date"]] == [
            BillingDocumentRegistrationError.REISSUE_DUE_DATE_IN_PAST.value
        ]
        return
    with pytest.raises(GatewayError) as raised:
        _ = reissue_billing_document(document, due, FakeReissueGateway())
    assert raised.value.error is expected


# ----- the events -----


def event(account: GatewayAccount, name: str, payment_id: str = "pay_old", event_id: str = "evt_1") -> GatewayEvent:
    return GatewayEvent.objects.create(
        gateway_account=account,
        event_id=event_id,
        event_type=name,
        payload={"id": event_id, "event": name, "payment": {"id": payment_id}},
    )


@pytest.mark.parametrize("name", ["PAYMENT_BANK_SLIP_CANCELLED", "PAYMENT_DELETED"])
def test_a_cancellation_marks_the_active_registration(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount, name: str
) -> None:
    result = process_gateway_event(event(account, name))

    registered.refresh_from_db()
    assert result.outcome == GatewayEvent.Outcome.PROCESSED
    assert registered.status == Status.CANCELLED
    document.refresh_from_db()
    assert document.status == BillingDocument.Status.REGISTERED
    assert body_registration(document) is None


def body_registration(document: BillingDocument) -> object:
    from ..serializers import BillingDocumentSerializer

    return BillingDocumentSerializer(document).data["registration"]


def test_the_cancellation_our_own_reissue_causes_is_ignored(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    BillingDocumentRegistration.objects.filter(pk=registered.pk).update(status=Status.REPLACED)

    result = process_gateway_event(event(account, "PAYMENT_DELETED"))

    assert (result.outcome, result.reason) == (GatewayEvent.Outcome.IGNORED, "registration_not_active")


def test_a_refund_of_a_paid_document_goes_to_staff(
    document: BillingDocument, registered: BillingDocumentRegistration, account: GatewayAccount
) -> None:
    BillingDocument.objects.filter(pk=document.pk).update(status="paid")

    result = process_gateway_event(event(account, "PAYMENT_REFUNDED"))

    assert (result.outcome, result.reason) == (GatewayEvent.Outcome.UNPROCESSED, "payment_refunded")


# ----- the API -----


def test_the_reissue_action(api_client: APIClient, document: BillingDocument, registered: BillingDocumentRegistration, monkeypatch: pytest.MonkeyPatch) -> None:
    gateway = FakeReissueGateway()
    gateway.payment_id = "pay_new"
    monkeypatch.setattr("apps.billing.services.reissue_billing_document.AsaasClient", lambda api_key: gateway)

    response = api_client.post(
        reverse("billing-document-reissue", args=[document.pk]), {"due_date": tomorrow().isoformat()}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["registration"]["registered_due_date"] == tomorrow().isoformat()


def test_the_reissue_action_reports_its_refusals(
    api_client: APIClient, document: BillingDocument, registered: BillingDocumentRegistration
) -> None:
    BillingDocument.objects.filter(pk=document.pk).update(status="issued")

    response = api_client.post(
        reverse("billing-document-reissue", args=[document.pk]), {"due_date": tomorrow().isoformat()}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == [BillingDocumentRegistrationError.DOCUMENT_NOT_REGISTERED.value]
