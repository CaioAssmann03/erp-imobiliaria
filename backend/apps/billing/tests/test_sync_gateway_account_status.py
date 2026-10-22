"""Gateway account status follows the gateway's general approval (spec 030, R5)."""

from typing import Any

import pytest

from apps.condominiums.models import Condominium

from ..models import GatewayAccount
from ..services.sync_gateway_account_status import sync_gateway_account_status

pytestmark = pytest.mark.django_db


class FakeStatus:
    def __init__(self, general: str) -> None:
        self.general = general

    def get_account_status(self) -> dict[str, Any]:
        return {"general": self.general}


@pytest.fixture
def account(condominium: Condominium) -> GatewayAccount:
    return GatewayAccount.objects.create(
        condominium=condominium, gateway_account_id="acc-1", wallet_id="w", api_key="k", webhook_token="t"
    )


def test_approval_activates_and_rejection_blocks(account: GatewayAccount) -> None:
    assert sync_gateway_account_status(account, FakeStatus("PENDING")).status == GatewayAccount.Status.PENDING

    approved = sync_gateway_account_status(account, FakeStatus("APPROVED"))
    assert approved.status == GatewayAccount.Status.ACTIVE
    assert approved.approved_at is not None

    assert sync_gateway_account_status(account, FakeStatus("REJECTED")).status == GatewayAccount.Status.BLOCKED
