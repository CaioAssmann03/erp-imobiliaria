"""Setting up the company's gateway account: key stored, checked and activated (spec 037, R8)."""

from typing import Any

import pytest
from django.core.management import call_command

from apps.core.models import Company

from ..errors import GatewayAccountError
from ..gateway.asaas_client import GatewayError
from ..models import GatewayAccount
from ..services.register_gateway_webhook import register_gateway_webhook
from ..services.rotate_gateway_webhook_token import rotate_gateway_webhook_token
from ..services.set_up_gateway_account import set_up_gateway_account

pytestmark = pytest.mark.django_db


class FakeStatus:
    def __init__(self, error: GatewayError | None = None) -> None:
        self.error = error

    def get_account_status(self) -> dict[str, Any]:
        if self.error is not None:
            raise self.error
        return {"general": "APPROVED"}


class FakeWebhooks:
    def __init__(self, existing: list[dict[str, Any]] | None = None) -> None:
        self.existing = existing or []
        self.created: list[dict[str, Any]] = []
        self.updated: list[tuple[str, dict[str, Any]]] = []

    def list_webhooks(self) -> list[dict[str, Any]]:
        return self.existing

    def create_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.created.append(payload)
        return {"id": "hook-new"}

    def update_webhook(self, webhook_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        self.updated.append((webhook_id, payload))
        return {"id": webhook_id}


def test_stores_key_creates_token_and_activates(company: Company) -> None:
    account = set_up_gateway_account(company, "$aact_key", FakeStatus())

    assert account.status == GatewayAccount.Status.ACTIVE
    assert account.api_key == "$aact_key"
    assert len(account.webhook_token) >= 32
    assert account.can_register_charges()


def test_is_idempotent_and_rotates_only_on_request(company: Company) -> None:
    first = set_up_gateway_account(company, "$aact_key", FakeStatus())
    again = set_up_gateway_account(company, "$aact_other_key", FakeStatus())

    assert GatewayAccount.objects.count() == 1
    assert again.pk == first.pk and again.webhook_token == first.webhook_token
    assert again.api_key == "$aact_other_key"

    rotated = rotate_gateway_webhook_token(again)
    assert rotated.webhook_token != first.webhook_token


def test_a_refused_key_stores_nothing(company: Company) -> None:
    refused = GatewayError(GatewayAccountError.GATEWAY_REJECTED, "HTTP 401", ("invalid_access_token",))

    with pytest.raises(GatewayError) as raised:
        set_up_gateway_account(company, "$aact_bad", FakeStatus(refused))

    assert raised.value.error is GatewayAccountError.API_KEY_INVALID
    assert "aact_bad" not in str(raised.value)
    assert not GatewayAccount.objects.exists()


def test_registers_the_webhook_once(company: Company, settings: Any) -> None:
    settings.ASAAS_WEBHOOK_URL = "https://erp.example/api/webhooks/asaas/"
    account = set_up_gateway_account(company, "$aact_key", FakeStatus())
    gateway = FakeWebhooks()

    assert register_gateway_webhook(account, "ops@example.com", gateway) == "hook-new"
    assert gateway.created[0]["authToken"] == account.webhook_token
    assert "PAYMENT_RECEIVED" in gateway.created[0]["events"]

    gateway.existing = [{"id": "hook-new", "url": settings.ASAAS_WEBHOOK_URL}]
    assert register_gateway_webhook(account, "ops@example.com", gateway) == "hook-new"
    assert len(gateway.created) == 1 and gateway.updated[0][0] == "hook-new"


def test_registering_needs_the_webhook_url(company: Company, settings: Any) -> None:
    settings.ASAAS_WEBHOOK_URL = ""
    account = set_up_gateway_account(company, "$aact_key", FakeStatus())

    with pytest.raises(GatewayError) as raised:
        register_gateway_webhook(account, "ops@example.com", FakeWebhooks())

    assert raised.value.error is GatewayAccountError.WEBHOOK_URL_MISSING


def test_the_command_rejects_an_unknown_company() -> None:
    with pytest.raises(Exception, match="Company not found"):
        call_command("setup_gateway_account", "00000000-0000-0000-0000-000000000000")
