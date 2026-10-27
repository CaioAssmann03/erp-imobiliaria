"""E-mailing a registered boleto and the provider's webhook (spec 035, R1–R8)."""

import base64
import hashlib
import hmac
import json
import time
from typing import Any

import pytest
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.delivery_email import build_boleto_email
from apps.billing.gateway.resend_client import EmailNotConfigured, EmailRejected, EmailUnavailable
from apps.finance.tests.base import body

from ..models import BillingDocument, BillingDocumentDelivery, BillingDocumentRegistration, GatewayAccount
from ..services.send_billing_document_email import send_billing_document_email

pytestmark = pytest.mark.django_db

Status = BillingDocumentDelivery.Status
SECRET = "whsec_" + base64.b64encode(b"resend-test-secret").decode()


class FakeSender:
    def __init__(self, failure: Exception | None = None) -> None:
        self.failure = failure
        self.sent: list[dict[str, str]] = []

    def send(self, to: str, subject: str, html: str, text: str, idempotency_key: str) -> str:
        if self.failure:
            raise self.failure
        self.sent.append({"to": to, "subject": subject, "html": html, "text": text, "key": idempotency_key})
        return "msg_1"


@pytest.fixture
def registration(document: BillingDocument) -> BillingDocumentRegistration:
    account = GatewayAccount.objects.create(
        company=document.unit.condominium.company,
        api_key="k",
        webhook_token="t",
        status=GatewayAccount.Status.ACTIVE,
    )
    document.status = BillingDocument.Status.REGISTERED
    document.save()
    return BillingDocumentRegistration.objects.create(
        document=document,
        gateway_account=account,
        registered_due_date=document.due_date,
        gateway_payment_id="pay_1",
        boleto_url="https://asaas.test/boleto/1",
        digitable_line="0001.2 3456",
        pix_payload="00020126pix",
    )


@pytest.fixture
def payer_email(document: BillingDocument) -> str:
    document.payer.email = "maria@example.com"
    document.payer.save()
    return "maria@example.com"


# ----- R1–R4: sending -----


def test_the_boleto_is_sent_by_e_mail_with_a_link_and_the_digitable_line(
    document: BillingDocument, registration: BillingDocumentRegistration, payer_email: str
) -> None:
    sender = FakeSender()

    delivery = send_billing_document_email(document, sender)

    assert delivery is not None
    assert (delivery.status, delivery.destination, delivery.provider_message_id) == (Status.SENT, payer_email, "msg_1")
    assert delivery.sent_at is not None
    mail = sender.sent[0]
    assert "https://asaas.test/boleto/1" in mail["text"] and "0001.2 3456" in mail["text"] and "00020126pix" in mail["text"]
    assert mail["key"] == str(delivery.pk)


def test_a_repeat_sends_nothing_twice(
    document: BillingDocument, registration: BillingDocumentRegistration, payer_email: str
) -> None:
    sender = FakeSender()
    first = send_billing_document_email(document, sender)
    again = send_billing_document_email(document, sender)

    assert first is not None and again is not None and again.pk == first.pk
    assert len(sender.sent) == 1


def test_a_payer_without_e_mail_is_a_failed_delivery_with_a_reason(
    document: BillingDocument, registration: BillingDocumentRegistration
) -> None:
    sender = FakeSender()

    delivery = send_billing_document_email(document, sender)

    assert delivery is not None
    assert (delivery.status, delivery.failure_reason) == (Status.FAILED, "payer_without_email")
    assert not sender.sent


@pytest.mark.parametrize(
    ("failure", "reason"), [(EmailNotConfigured(), "email_not_configured"), (EmailRejected("HTTP 422"), "provider_rejected")]
)
def test_an_unconfigured_or_refusing_provider_fails_the_delivery(
    document: BillingDocument, registration: BillingDocumentRegistration, payer_email: str, failure: Exception, reason: str
) -> None:
    delivery = send_billing_document_email(document, FakeSender(failure))

    assert delivery is not None and (delivery.status, delivery.failure_reason) == (Status.FAILED, reason)


def test_an_unavailable_provider_raises_and_the_retry_sends_once(
    document: BillingDocument, registration: BillingDocumentRegistration, payer_email: str
) -> None:
    with pytest.raises(EmailUnavailable):
        _ = send_billing_document_email(document, FakeSender(EmailUnavailable("HTTP 503")))
    assert BillingDocumentDelivery.objects.get().status == Status.PENDING

    sender = FakeSender()
    delivery = send_billing_document_email(document, sender)

    assert delivery is not None and delivery.status == Status.SENT and len(sender.sent) == 1
    assert BillingDocumentDelivery.objects.count() == 1


def test_a_document_without_registration_is_not_sent(document: BillingDocument, payer_email: str) -> None:
    assert send_billing_document_email(document, FakeSender()) is None


def test_the_e_mail_escapes_what_it_prints(document: BillingDocument, registration: BillingDocumentRegistration) -> None:
    document.payer.name = "<script>x</script>"
    registration.boleto_url = 'https://x.test/?a="b"'

    _, html, _ = build_boleto_email(document, registration)

    assert "<script>" not in html and "&lt;script&gt;" in html and "&quot;b&quot;" in html


# ----- R5, R6: the provider's webhook -----


def signed(payload: dict[str, Any], secret: str = SECRET, timestamp: int | None = None) -> dict[str, str]:
    raw = json.dumps(payload)
    stamp = str(timestamp or int(time.time()))
    key = base64.b64decode(secret.removeprefix("whsec_"))
    signature = base64.b64encode(hmac.new(key, f"msg_x.{stamp}.{raw}".encode(), hashlib.sha256).digest()).decode()
    return {"HTTP_SVIX_ID": "msg_x", "HTTP_SVIX_TIMESTAMP": stamp, "HTTP_SVIX_SIGNATURE": f"v1,{signature}"}


def post_event(event: str, headers: dict[str, str] | None = None, payload: dict[str, Any] | None = None) -> int:
    payload = payload or {"type": event, "data": {"email_id": "msg_1"}}
    client = APIClient()
    client.credentials(**(signed(payload) if headers is None else headers))
    response = client.generic("POST", reverse("resend-webhook"), json.dumps(payload), content_type="application/json")
    return int(response.status_code)


@pytest.fixture
def sent(document: BillingDocument, registration: BillingDocumentRegistration, payer_email: str) -> BillingDocumentDelivery:
    delivery = send_billing_document_email(document, FakeSender())
    assert delivery is not None
    return delivery


@override_settings(RESEND_WEBHOOK_SECRET=SECRET)
def test_delivered_and_bounced_events_update_the_delivery(sent: BillingDocumentDelivery) -> None:
    assert post_event("email.delivered") == status.HTTP_200_OK
    sent.refresh_from_db()
    assert sent.status == Status.DELIVERED

    assert post_event("email.bounced") == status.HTTP_200_OK
    sent.refresh_from_db()
    assert (sent.status, sent.failure_reason) == (Status.FAILED, "bounced")

    assert post_event("email.delivered") == status.HTTP_200_OK  # a failed delivery is never promoted
    sent.refresh_from_db()
    assert sent.status == Status.FAILED


@override_settings(RESEND_WEBHOOK_SECRET=SECRET)
def test_an_unsigned_wrong_or_old_request_is_refused(sent: BillingDocumentDelivery) -> None:
    payload: dict[str, Any] = {"type": "email.delivered", "data": {"email_id": "msg_1"}}

    assert post_event("x", {}, payload) == status.HTTP_401_UNAUTHORIZED
    assert post_event("x", signed(payload, "whsec_" + base64.b64encode(b"other").decode()), payload) == status.HTTP_401_UNAUTHORIZED
    assert post_event("x", signed(payload, timestamp=int(time.time()) - 3600), payload) == status.HTTP_401_UNAUTHORIZED
    sent.refresh_from_db()
    assert sent.status == Status.SENT


# ----- R7, R8: the registration triggers it; the API shows it -----


def test_a_registration_enqueues_the_e_mail_after_the_commit(  # type: ignore[no-untyped-def]
    document: BillingDocument, monkeypatch: pytest.MonkeyPatch, django_capture_on_commit_callbacks
) -> None:
    from apps.persons.models import PeopleIndividual

    from ..services.register_billing_document import register_billing_document
    from .test_register_billing_document import FakeChargeGateway

    _ = GatewayAccount.objects.create(
        company=document.unit.condominium.company,
        api_key="k",
        webhook_token="t",
        status=GatewayAccount.Status.ACTIVE,
    )
    _ = PeopleIndividual.objects.create(person=document.payer, company=document.payer.company, cpf="52998224725")
    sent_tasks: list[tuple[str, list[str]]] = []
    monkeypatch.setattr(
        "apps.billing.services.register_billing_document.celery_app.send_task",
        lambda name, args: sent_tasks.append((name, args)),
    )

    with django_capture_on_commit_callbacks(execute=True):
        _ = register_billing_document(document, FakeChargeGateway())

    assert sent_tasks == [("apps.billing.tasks.send_billing_document_email_task", [str(document.pk)])]


def test_the_documents_api_shows_the_delivery(api_client: APIClient, document: BillingDocument, sent: BillingDocumentDelivery) -> None:
    data = body(api_client.get(reverse("billing-document-detail", args=[document.pk])))

    assert data["delivery"]["status"] == "sent" and data["delivery"]["destination"] == "maria@example.com"
