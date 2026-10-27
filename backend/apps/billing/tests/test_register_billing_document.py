"""Registering an issued document as a boleto charge at the gateway (spec 031, R1–R6)."""

from datetime import date
from typing import Any

import pytest

from apps.billing.errors import BillingDocumentRegistrationError, GatewayAccountError
from apps.billing.infrastructure.gateway.asaas_client import GatewayError, GatewayUnavailable
from apps.persons.models import PeopleIndividual

from ..models import BillingDocument, BillingDocumentRegistration, GatewayAccount, GatewayCustomer
from ..services.register_billing_document import register_billing_document

pytestmark = pytest.mark.django_db

CPF = "52998224725"


class FakeChargeGateway:
    def __init__(self) -> None:
        self.customers: list[dict[str, Any]] = []
        self.payments: list[dict[str, Any]] = []
        self.created_customers: list[dict[str, Any]] = []
        self.created_payments: list[dict[str, Any]] = []
        self.payment_failure: GatewayError | None = None
        self.pix_failure: GatewayError | None = None
        self.details_failure: GatewayError | None = None
        self.payment_id = "pay_1"

    def find_customers(self, query: dict[str, str]) -> list[dict[str, Any]]:
        return self.customers

    def create_customer(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.created_customers.append(payload)
        return {"id": "cus_1"}

    def find_payments_by_external_reference(self, external_reference: str) -> list[dict[str, Any]]:
        return self.payments

    def create_payment(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.payment_failure:
            raise self.payment_failure
        self.created_payments.append(payload)
        return {"id": self.payment_id, "bankSlipUrl": "https://asaas.test/boleto/1"}

    def get_identification_field(self, payment_id: str) -> dict[str, Any]:
        if self.details_failure:
            raise self.details_failure
        return {"identificationField": "0001.2 3456", "nossoNumero": "123", "barCode": "9999"}

    def get_pix_qr_code(self, payment_id: str) -> dict[str, Any]:
        if self.pix_failure:
            raise self.pix_failure
        return {"payload": "00020126pix", "expirationDate": "2026-11-10 23:59:59", "encodedImage": "x"}


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
    _ = PeopleIndividual.objects.create(person=document.payer, company=document.payer.company, cpf=CPF)


def test_registers_and_marks_document_registered(document: BillingDocument, account: GatewayAccount) -> None:
    registration = register_billing_document(document, FakeChargeGateway())

    document.refresh_from_db()
    assert document.status == BillingDocument.Status.REGISTERED
    assert registration.status == BillingDocumentRegistration.Status.ACTIVE
    assert registration.registered_due_date == document.due_date


def test_charge_carries_document_terms(document: BillingDocument, account: GatewayAccount) -> None:
    document.discount_percentage = 5
    document.discount_days = 3
    document.late_fee_percentage = 2
    document.monthly_interest_percentage = 1
    document.save()
    gateway = FakeChargeGateway()

    _ = register_billing_document(document, gateway)

    payload = gateway.created_payments[0]
    assert payload["externalReference"] == str(document.pk)
    assert (payload["value"], payload["dueDate"], payload["billingType"]) == (
        float(document.amount),
        document.due_date.isoformat(),
        "BOLETO",
    )
    assert payload["fine"] == {"value": 2.0, "type": "PERCENTAGE"}
    assert payload["interest"] == {"value": 1.0}
    assert payload["discount"] == {"value": 5.0, "dueDateLimitDays": 3, "type": "PERCENTAGE"}
    assert payload["daysAfterDueDateToRegistrationCancellation"] == 60


def test_customer_is_looked_up_then_created_once(document: BillingDocument, account: GatewayAccount) -> None:
    gateway = FakeChargeGateway()

    _ = register_billing_document(document, gateway)

    assert len(gateway.created_customers) == 1
    assert gateway.created_customers[0]["notificationDisabled"] is True
    assert gateway.created_customers[0]["cpfCnpj"] == CPF
    assert GatewayCustomer.objects.get().gateway_customer_id == "cus_1"

    other = FakeChargeGateway()
    other.payment_id = "pay_2"
    document.status = BillingDocument.Status.ISSUED
    document.save()
    document.registrations.update(status=BillingDocumentRegistration.Status.REPLACED)
    _ = register_billing_document(document, other)
    assert not other.created_customers  # the stored customer is reused without asking the gateway


def test_registration_stores_boleto_and_pix_details(document: BillingDocument, account: GatewayAccount) -> None:
    registration = register_billing_document(document, FakeChargeGateway())

    assert (registration.gateway_payment_id, registration.our_number) == ("pay_1", "123")
    assert (registration.digitable_line, registration.barcode) == ("0001.2 3456", "9999")
    assert registration.boleto_url == "https://asaas.test/boleto/1"
    assert registration.pix_payload == "00020126pix"
    assert registration.pix_expires_at is not None and registration.pix_expires_at.date() == date(2026, 11, 10)


def test_a_missing_pix_qr_code_keeps_the_boleto(document: BillingDocument, account: GatewayAccount) -> None:
    gateway = FakeChargeGateway()
    gateway.pix_failure = GatewayError(GatewayAccountError.GATEWAY_REJECTED)

    registration = register_billing_document(document, gateway)

    assert registration.digitable_line and not registration.pix_payload


def test_is_idempotent_and_reuses_charge_after_lost_response(document: BillingDocument, account: GatewayAccount) -> None:
    lost = FakeChargeGateway()
    lost.details_failure = GatewayUnavailable("timeout")
    with pytest.raises(GatewayUnavailable):
        _ = register_billing_document(document, lost)
    assert not document.registrations.exists()

    # The retry finds the charge that the first attempt had already created.
    retry = FakeChargeGateway()
    retry.payments = [{"id": "pay_1", "bankSlipUrl": "https://asaas.test/boleto/1"}]
    first = register_billing_document(document, retry)
    again = register_billing_document(document, retry)

    assert not retry.created_payments
    assert again.pk == first.pk
    assert document.registrations.count() == 1


def test_a_refusal_is_kept_as_a_failed_registration(document: BillingDocument, account: GatewayAccount) -> None:
    gateway = FakeChargeGateway()
    gateway.payment_failure = GatewayError(GatewayAccountError.GATEWAY_REJECTED, codes=("invalid_customer",))

    registration = register_billing_document(document, gateway)

    document.refresh_from_db()
    assert registration.status == BillingDocumentRegistration.Status.FAILED
    assert registration.error_codes == ["invalid_customer"]
    assert document.status == BillingDocument.Status.ISSUED


@pytest.mark.parametrize("remove", ["account", "tax_id", "status"])
def test_preconditions_are_refused(document: BillingDocument, account: GatewayAccount, remove: str) -> None:
    if remove == "account":
        account.status = GatewayAccount.Status.PENDING
        account.save()
        expected = BillingDocumentRegistrationError.NO_ACTIVE_GATEWAY_ACCOUNT
    elif remove == "tax_id":
        PeopleIndividual.objects.filter(person=document.payer).delete()
        document.payer.refresh_from_db()
        expected = BillingDocumentRegistrationError.PAYER_WITHOUT_DOCUMENT
    else:
        document.status = BillingDocument.Status.CANCELLED
        document.save()
        expected = BillingDocumentRegistrationError.DOCUMENT_NOT_ISSUED

    with pytest.raises(GatewayError) as raised:
        _ = register_billing_document(document, FakeChargeGateway())

    assert raised.value.error is expected
