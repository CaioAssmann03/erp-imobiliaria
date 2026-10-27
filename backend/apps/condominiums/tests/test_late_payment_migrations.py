"""The migrations of spec 020 on rows that already exist (R1).

Each test goes back to the schema before the late-payment rules, creates rows with the historical
models, migrates forward and checks what they became. The schema is brought back to the latest
migration afterwards, so the other tests find the tables they expect.
"""

from collections.abc import Iterator
from decimal import Decimal
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

from apps.core.testing import SEEDED_COMPANY_CNPJ

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("condominiums", "0004_condominium_code")]
AFTER = [("condominiums", "0007_billingrules_exempts_manager_unit_and_more")]  # the billing rules still lived here
FRACTION_COLUMNS = {f"ideal_fraction_{number}" for number in range(2, 7)}


def migrate(targets: list[tuple[str, str]]) -> StateApps:
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return executor.loader.project_state(targets).apps


@pytest.fixture(autouse=True)
def restore_the_latest_schema() -> Iterator[None]:
    yield
    executor = MigrationExecutor(connection)
    executor.migrate(executor.loader.graph.leaf_nodes())


def create_condominium(apps: StateApps) -> Any:
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"}
    )
    condominium_model: Any = apps.get_model("condominiums", "Condominium")
    return condominium_model.objects.create(company=company, name="Sol", cnpj="11222333000181")


def columns_of(table: str) -> set[str]:
    with connection.cursor() as cursor:
        return {column.name for column in connection.introspection.get_table_description(cursor, table)}


def tables() -> set[str]:
    with connection.cursor() as cursor:
        return set(connection.introspection.table_names(cursor))


def test_existing_billing_rules_get_the_defaults() -> None:
    old_apps = migrate(BEFORE)
    condominium = create_condominium(old_apps)
    billing_rules_model: Any = old_apps.get_model("condominiums", "BillingRules")
    _ = billing_rules_model.objects.create(
        condominium=condominium, due_day=15, calculation_period="following"
    )

    new_apps = migrate(AFTER)

    rules: Any = new_apps.get_model("condominiums", "BillingRules").objects.get()
    assert (rules.due_day, rules.due_month) == (15, "following")  # the old value, under the new name
    assert rules.competence_month == "same_as_due"
    assert rules.late_fee_percentage == Decimal("0")
    assert rules.initial_late_fee_percentage is None
    assert rules.initial_late_fee_days is None
    assert rules.interest_calculation == "full_month"
    assert rules.interest_grace_days == 0
    assert rules.should_show_qr_code is False
    assert rules.should_show_fee_statement is False


def test_due_month_keeps_the_old_column() -> None:
    migrate(AFTER)

    columns = columns_of("condominiums_billingrules")

    assert "calculation_period" in columns
    assert "due_month" not in columns


def test_the_migrations_reverse() -> None:
    migrate(BEFORE)

    assert "condominiums_lateinterestrate" not in tables()
    billing_columns = columns_of("condominiums_billingrules")
    assert "calculation_period" in billing_columns
    assert "competence_month" not in billing_columns
    assert not FRACTION_COLUMNS & columns_of("condominiums_unit")

    migrate(AFTER)

    assert "condominiums_lateinterestrate" in tables()
    assert FRACTION_COLUMNS <= columns_of("condominiums_unit")
