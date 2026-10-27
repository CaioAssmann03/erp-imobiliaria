"""GatewayAccount: one per company, credentials encrypted and never exposed (spec 037, R1, R2)."""

import pytest
from django.db import IntegrityError, connection, transaction

from apps.core.models import Company

from ..models import GatewayAccount

pytestmark = pytest.mark.django_db


def make_account(company: Company, **overrides: str) -> GatewayAccount:
    values = {"api_key": "$aact_secret_key", "webhook_token": "secret-webhook-token"}
    return GatewayAccount.objects.create(company=company, **{**values, **overrides})


def test_one_account_per_company(company: Company) -> None:
    make_account(company)

    with pytest.raises(IntegrityError), transaction.atomic():
        make_account(company, webhook_token="another")


def test_credentials_are_encrypted_and_never_exposed(company: Company) -> None:
    account = make_account(company)

    with connection.cursor() as cursor:
        cursor.execute("SELECT api_key, webhook_token FROM billing_gatewayaccount WHERE id = %s", [account.id])
        stored_key, stored_token = cursor.fetchone()
    assert "aact_secret_key" not in stored_key
    assert "secret-webhook-token" not in stored_token
    account.refresh_from_db()
    assert account.api_key == "$aact_secret_key"
    assert "aact_secret_key" not in str(account) + repr(account)


def test_only_active_account_can_register_charges(company: Company) -> None:
    account = make_account(company)
    assert not account.can_register_charges()

    account.status = GatewayAccount.Status.ACTIVE
    assert account.can_register_charges()

    account.status = GatewayAccount.Status.BLOCKED
    assert not account.can_register_charges()


def test_credentials_stay_out_of_the_audit_log(company: Company) -> None:
    from auditlog.models import LogEntry

    account = make_account(company)

    changes = LogEntry.objects.get_for_object(account).get().changes
    assert "api_key" not in changes and "webhook_token" not in changes
    assert "aact_secret_key" not in str(changes)
