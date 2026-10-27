"""The rename migration of spec 042 on rows that already exist (R3).

Each test goes back to the schema before the rename, creates rows with the historical models,
migrates forward and checks that nothing was lost. The schema is brought back to the latest
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

BEFORE = [("condominiums", "0012_condominium_billing_rules_in_billing")]
OLD_TABLES = {"condominiums_apportionmentcriterion", "condominiums_unitfraction"}
NEW_TABLES = {"condominiums_condominiumapportionmentcriterion", "condominiums_unitapportionmentfraction"}


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


def tables() -> set[str]:
    with connection.cursor() as cursor:
        return set(connection.introspection.table_names(cursor))


def old_rows(apps: StateApps) -> tuple[Any, Any]:
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"}
    )
    condominium: Any = apps.get_model("condominiums", "Condominium").objects.create(
        company=company, name="Sol", cnpj="11222333000181"
    )
    unit: Any = apps.get_model("condominiums", "Unit").objects.create(condominium=condominium, name="1")
    criterion: Any = apps.get_model("condominiums", "ApportionmentCriterion").objects.create(
        condominium=condominium, name="Elevador", position=2
    )
    fraction: Any = apps.get_model("condominiums", "UnitFraction").objects.create(
        unit=unit, criterion=criterion, value=Decimal("0.5")
    )
    return criterion, fraction


def test_the_rows_keep_their_ids_and_links_under_the_new_names() -> None:
    criterion, fraction = old_rows(migrate(BEFORE))

    new_apps = migrate(latest())

    new_criterion: Any = new_apps.get_model("condominiums", "CondominiumApportionmentCriterion").objects.get()
    new_fraction: Any = new_apps.get_model("condominiums", "UnitApportionmentFraction").objects.get()
    assert (new_criterion.pk, new_criterion.name, new_criterion.position) == (criterion.pk, "Elevador", 2)
    assert (new_fraction.pk, new_fraction.criterion_id, new_fraction.value) == (
        fraction.pk,
        criterion.pk,
        Decimal("0.50000000"),
    )
    assert NEW_TABLES <= tables()
    assert not OLD_TABLES & tables()


def test_the_plan_item_still_points_at_the_renamed_table() -> None:
    _ = migrate(latest())

    with connection.cursor() as cursor:
        constraints = connection.introspection.get_constraints(cursor, "billing_billingplanitem")

    targets = {details["foreign_key"] for details in constraints.values() if details["foreign_key"]}
    assert ("condominiums_condominiumapportionmentcriterion", "id") in targets


def test_going_back_restores_the_old_names_and_rows() -> None:
    criterion, _ = old_rows(migrate(BEFORE))
    _ = migrate(latest())

    back_apps = migrate(BEFORE)

    assert OLD_TABLES <= tables()
    assert not NEW_TABLES & tables()
    assert back_apps.get_model("condominiums", "ApportionmentCriterion").objects.get().pk == criterion.pk
