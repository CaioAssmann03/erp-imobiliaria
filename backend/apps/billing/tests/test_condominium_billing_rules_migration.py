"""The migrations of spec 041 on rows that already exist (R6).

Each test goes back to the schema where the rules and the rates still lived in `condominiums`,
creates rows with the historical models, migrates forward and checks what they became. The schema
is brought back to the latest migration afterwards, so the other tests find the tables they expect.
"""

import importlib
from collections.abc import Iterator
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

from apps.condominiums.models import Condominium
from apps.core.testing import SEEDED_COMPANY_CNPJ

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("billing", "0011_apportionment_criteria"), ("condominiums", "0011_person_module_memberships")]
MIGRATION = "apps.billing.migrations.0012_condominium_billing_rules_in_billing"


def migrate(targets: list[tuple[str, str]]) -> StateApps:
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return executor.loader.project_state(targets).apps


def latest() -> list[tuple[str, str]]:
    return list(MigrationExecutor(connection).loader.graph.leaf_nodes())


@pytest.fixture(autouse=True)
def restore_the_latest_schema() -> Iterator[None]:
    yield
    migrate(latest())


def create_condominium(apps: StateApps, name: str = "Sol", cnpj: str = "11222333000181") -> Any:
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "ADMINISTRADORA EXEMPLO LTDA"}
    )
    condominium_model: Any = apps.get_model("condominiums", "Condominium")
    return condominium_model.objects.create(company=company, name=name, cnpj=cnpj)


def old_rows(apps: StateApps) -> tuple[Any, Any]:
    return apps.get_model("condominiums", "BillingRules"), apps.get_model("condominiums", "LateInterestRate")


def test_the_rules_and_the_rates_are_copied_with_their_ids_and_values() -> None:
    old_apps = migrate(BEFORE)
    condominium = create_condominium(old_apps)
    old_rules_model, old_rate_model = old_rows(old_apps)
    old_rules = old_rules_model.objects.create(
        condominium=condominium,
        due_day=15,
        due_month="following",
        issuance_day=5,
        late_fee_percentage=Decimal("2.00"),
        initial_late_fee_percentage=Decimal("1.00"),
        initial_late_fee_days=5,
        interest_calculation="per_day",
        should_show_qr_code=True,
    )
    old_rate = old_rate_model.objects.create(
        condominium=condominium, start_date=date(2026, 1, 1), monthly_percentage=Decimal("1.50")
    )
    stamp = datetime(2026, 3, 4, 5, 6, tzinfo=timezone.utc)
    old_rate_model.objects.filter(pk=old_rate.pk).update(created_at=stamp, updated_at=stamp)

    new_apps = migrate(latest())

    rules: Any = new_apps.get_model("billing", "CondominiumBillingRules").objects.get()
    assert rules.pk == old_rules.pk
    assert rules.condominium_id == condominium.pk
    assert (rules.due_day, rules.due_month, rules.issuance_day) == (15, "following", 5)
    assert (rules.late_fee_percentage, rules.initial_late_fee_percentage, rules.initial_late_fee_days) == (
        Decimal("2.00"),
        Decimal("1.00"),
        5,
    )
    assert (rules.interest_calculation, rules.should_show_qr_code) == ("per_day", True)
    rate: Any = new_apps.get_model("billing", "LateInterestRate").objects.get()
    assert (rate.pk, rate.condominium_id, rate.start_date, rate.monthly_percentage) == (
        old_rate.pk,
        condominium.pk,
        date(2026, 1, 1),
        Decimal("1.50"),
    )
    assert (rate.created_at, rate.updated_at) == (stamp, stamp)


def test_running_the_copy_again_changes_nothing() -> None:
    old_apps = migrate(BEFORE)
    condominium = create_condominium(old_apps)
    old_rules_model, _ = old_rows(old_apps)
    _ = old_rules_model.objects.create(condominium=condominium, due_day=12)
    new_apps = migrate(latest())
    both_apps = MigrationExecutor(connection).loader.project_state(
        [("billing", "0012_condominium_billing_rules_in_billing"), ("condominiums", "0011_person_module_memberships")]
    ).apps

    importlib.import_module(MIGRATION).copy_to_billing(both_apps, None)

    new_rules_model: Any = new_apps.get_model("billing", "CondominiumBillingRules")
    assert new_rules_model.objects.count() == 1
    assert new_rules_model.objects.get().due_day == 12


def test_the_old_tables_keep_their_rows_for_the_previous_release() -> None:
    old_apps = migrate(BEFORE)
    condominium = create_condominium(old_apps)
    old_rules_model, old_rate_model = old_rows(old_apps)
    _ = old_rules_model.objects.create(condominium=condominium)
    _ = old_rate_model.objects.create(condominium=condominium, start_date=date(2026, 1, 1), monthly_percentage=1)

    _ = migrate(latest())

    with connection.cursor() as cursor:
        for table in ("condominiums_billingrules", "condominiums_lateinterestrate"):
            cursor.execute(f"SELECT count(*) FROM {table}")
            assert cursor.fetchone() == (1,)


def test_a_condominium_can_be_deleted_while_the_old_rows_remain() -> None:
    old_apps = migrate(BEFORE)
    condominium = create_condominium(old_apps)
    old_rules_model, _ = old_rows(old_apps)
    _ = old_rules_model.objects.create(condominium=condominium)
    _ = migrate(latest())

    Condominium.objects.get(pk=condominium.pk).delete()

    assert not Condominium.objects.exists()


def test_going_back_copies_the_current_rows_into_the_old_tables() -> None:
    old_apps = migrate(BEFORE)
    kept = create_condominium(old_apps, "Sol", "11222333000181")
    gone = create_condominium(old_apps, "Lua", "45723174000110")
    old_rules_model, old_rate_model = old_rows(old_apps)
    _ = old_rules_model.objects.create(condominium=kept, due_day=10)
    _ = old_rules_model.objects.create(condominium=gone, due_day=11)
    _ = old_rate_model.objects.create(condominium=kept, start_date=date(2026, 1, 1), monthly_percentage=1)
    new_apps = migrate(latest())
    new_rules_model: Any = new_apps.get_model("billing", "CondominiumBillingRules")
    new_rate_model: Any = new_apps.get_model("billing", "LateInterestRate")
    _ = new_rules_model.objects.filter(condominium_id=kept.pk).update(due_day=20)
    _ = new_rules_model.objects.filter(condominium_id=gone.pk).delete()
    _ = new_rate_model.objects.create(condominium_id=kept.pk, start_date=date(2026, 6, 1), monthly_percentage=2)

    back_apps = migrate(BEFORE)

    back_rules_model, back_rate_model = old_rows(back_apps)
    assert [(rules.condominium_id, rules.due_day) for rules in back_rules_model.objects.all()] == [(kept.pk, 20)]
    assert sorted(rate.start_date for rate in back_rate_model.objects.all()) == [date(2026, 1, 1), date(2026, 6, 1)]
