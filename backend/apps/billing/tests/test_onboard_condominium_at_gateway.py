"""Onboarding a condominium at the gateway (spec 030, R3, R4, R7)."""

from decimal import Decimal
from typing import Any

import pytest

from apps.billing.errors import GatewayAccountError
from apps.billing.gateway.asaas_client import GatewayError
from apps.condominiums.models import Address, Condominium

from ..models import GatewayAccount
from ..services.onboard_condominium_at_gateway import GatewayApplicant, onboard_condominium_at_gateway

pytestmark = pytest.mark.django_db

APPLICANT = GatewayApplicant(
    email="sindico@example.com", mobile_phone="11999990000", monthly_income=Decimal("5000"), company_type="ASSOCIATION"
)


class FakeGateway:
    def __init__(self, existing: list[dict[str, Any]] | None = None, failure: GatewayError | None = None) -> None:
        self.existing = existing or []
        self.failure = failure
        self.created: list[dict[str, Any]] = []

    def find_accounts_by_document(self, cpf_cnpj: str) -> list[dict[str, Any]]:
        return self.existing

    def create_account(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.failure:
            raise self.failure
        self.created.append(payload)
        return {"id": "acc-1", "walletId": "wallet-1", "apiKey": "$aact_secret_key"}


@pytest.fixture
def addressed_condominium(condominium: Condominium) -> Condominium:
    condominium.address = Address.objects.create(
        zip_code="01310100", street="Av. Paulista", number="1000", district="Bela Vista", city="São Paulo", state="SP"
    )
    condominium.save()
    return condominium


def test_creates_sub_account_and_stores_credentials(addressed_condominium: Condominium) -> None:
    gateway = FakeGateway()

    account = onboard_condominium_at_gateway(addressed_condominium, APPLICANT, gateway)

    assert account.status == GatewayAccount.Status.PENDING
    assert (account.gateway_account_id, account.wallet_id, account.api_key) == ("acc-1", "wallet-1", "$aact_secret_key")
    assert account.webhook_token
    payload = gateway.created[0]
    assert payload["cpfCnpj"] == addressed_condominium.cnpj
    assert payload["postalCode"] == "01310100"


def test_is_idempotent_after_timeout(addressed_condominium: Condominium) -> None:
    gateway = FakeGateway()
    first = onboard_condominium_at_gateway(addressed_condominium, APPLICANT, gateway)

    second = onboard_condominium_at_gateway(addressed_condominium, APPLICANT, gateway)

    assert second.pk == first.pk
    assert len(gateway.created) == 1


def test_remote_account_without_local_record_is_refused(addressed_condominium: Condominium) -> None:
    gateway = FakeGateway(existing=[{"id": "acc-9"}])

    with pytest.raises(GatewayError) as raised:
        onboard_condominium_at_gateway(addressed_condominium, APPLICANT, gateway)

    assert raised.value.error is GatewayAccountError.ALREADY_REGISTERED_REMOTELY
    assert not GatewayAccount.objects.exists()


def test_failure_leaves_no_record(addressed_condominium: Condominium) -> None:
    gateway = FakeGateway(failure=GatewayError(GatewayAccountError.GATEWAY_UNAVAILABLE))

    with pytest.raises(GatewayError) as raised:
        onboard_condominium_at_gateway(addressed_condominium, APPLICANT, gateway)

    assert raised.value.error is GatewayAccountError.GATEWAY_UNAVAILABLE
    assert not GatewayAccount.objects.exists()


def test_incomplete_address_is_refused_before_calling_the_gateway(condominium: Condominium) -> None:
    gateway = FakeGateway()

    with pytest.raises(GatewayError) as raised:
        onboard_condominium_at_gateway(condominium, APPLICANT, gateway)

    assert raised.value.error is GatewayAccountError.CONDOMINIUM_ADDRESS_INCOMPLETE
    assert not gateway.created
