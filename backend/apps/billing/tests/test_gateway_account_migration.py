"""The migration that moves the gateway account from the condominium to the company (spec 037)."""

from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

BEFORE = [("billing", "0012_condominium_billing_rules_in_billing")]
AFTER = [("billing", "0014_gateway_account_company_required")]

pytestmark = pytest.mark.django_db(transaction=True)


def _migrate(targets: list[tuple[str, str]]) -> Any:
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return MigrationExecutor(connection).loader.project_state(targets).apps


def _seed_company_with_condominiums(apps: Any, count: int) -> list[Any]:
    Company = apps.get_model("core", "Company")
    Condominium = apps.get_model("condominiums", "Condominium")
    company = Company.objects.create(legal_name="Eve", cnpj="11222333000181")
    cnpjs = ("45723174000110", "11444777000161")
    return [Condominium.objects.create(company=company, name=f"C{i}", cnpj=cnpjs[i]) for i in range(count)]


def _account(apps: Any, condominium: Any, suffix: str) -> Any:
    return apps.get_model("billing", "GatewayAccount").objects.create(
        condominium=condominium, gateway_account_id=f"acc-{suffix}", wallet_id="w", api_key="k", webhook_token="t"
    )


def test_moves_the_account_to_the_company_of_its_condominium() -> None:
    old_apps = _migrate(BEFORE)
    condominium = _seed_company_with_condominiums(old_apps, 1)[0]
    _account(old_apps, condominium, "1")

    new_apps = _migrate(AFTER)

    account = new_apps.get_model("billing", "GatewayAccount").objects.get()
    assert account.company_id == condominium.company_id
    _migrate(AFTER)


def test_refuses_rows_that_map_to_one_company_twice() -> None:
    old_apps = _migrate(BEFORE)
    first, second = _seed_company_with_condominiums(old_apps, 2)
    _account(old_apps, first, "1")
    _account(old_apps, second, "2")

    with pytest.raises(RuntimeError, match="same company"):
        _migrate(AFTER)

    old_apps.get_model("billing", "GatewayAccount").objects.all().delete()
    _migrate(AFTER)
