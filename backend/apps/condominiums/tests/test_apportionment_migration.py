"""The data migrations of spec 047: the six fraction columns become criteria and rows (and back).

Each test goes back to the schema before the criteria, creates rows with the historical models,
migrates forward and checks the result. The schema is brought back to the latest migration
afterwards, so the other tests find the tables they expect. Delete this file once 039 is deployed.
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

BEFORE = [
    ("condominiums", "0009_backfill_person_members"),
    ("billing", "0010_billing_document_delivery"),
    ("finance", "0014_cost_center_code_required"),
]


def migrate(targets: list[tuple[str, str]]) -> StateApps:
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return executor.loader.project_state(targets).apps


def latest() -> list[tuple[str, str]]:
    """The schema right after spec 047, before the models were renamed (spec 042)."""
    return [
        ("condominiums", "0011_person_module_memberships"),
        ("billing", "0011_apportionment_criteria"),
    ]


@pytest.fixture(autouse=True)
def restore_the_latest_schema() -> Iterator[None]:
    yield
    executor = MigrationExecutor(connection)
    executor.migrate(executor.loader.graph.leaf_nodes())


def old_condominium_with_units(apps: StateApps) -> tuple[Any, Any, Any]:
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ,
        defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"},
    )
    condominium_model: Any = apps.get_model("condominiums", "Condominium")
    unit_model: Any = apps.get_model("condominiums", "Unit")
    condominium = condominium_model.objects.create(
        company=company, name="Sol", cnpj="11222333000181"
    )
    _ = condominium_model.objects.create(
        company=company, name="Lua", cnpj="45723174000110"
    )
    first = unit_model.objects.create(
        condominium=condominium,
        name="1",
        ideal_fraction=Decimal("0.6"),
        ideal_fraction_2=Decimal("0.3"),
    )
    second = unit_model.objects.create(
        condominium=condominium,
        name="2",
        ideal_fraction=Decimal("0.4"),
        ideal_fraction_4=Decimal("0.2"),
    )
    return condominium, first, second


def old_plan_items(apps: StateApps, condominium: Any) -> dict[int | None, Any]:
    """A share item by the 2nd fraction, one by the 5th (nobody has it) and a fixed one."""
    cost_center: Any = apps.get_model("finance", "CostCenter").objects.create(
        condominium=condominium, code=0, name="Geral"
    )
    entry_template: Any = apps.get_model("finance", "EntryTemplate").objects.create(
        name="Taxa", cost_center=cost_center
    )
    plan: Any = apps.get_model("billing", "BillingPlan").objects.create(
        condominium=condominium, name="Plano"
    )
    item_model: Any = apps.get_model("billing", "BillingPlanItem")

    def item(position: int, kind: str, number: int | None) -> Any:
        return item_model.objects.create(
            plan=plan,
            position=position,
            description=f"Item {position}",
            cost_center=cost_center,
            entry_template=entry_template,
            calculation_kind=kind,
            amount=Decimal(100),
            ideal_fraction_number=number,
        )

    return {
        2: item(1, "ideal_fraction_share", 2),
        5: item(2, "ideal_fraction_share", 5),
        None: item(3, "fixed_amount", None),
    }


def test_backfill_creates_criteria_fraction_rows_and_maps_plan_items() -> None:
    old_apps = migrate(BEFORE)
    condominium, first, second = old_condominium_with_units(old_apps)
    items = old_plan_items(old_apps, condominium)

    new_apps = migrate(latest())

    criterion_model: Any = new_apps.get_model("condominiums", "ApportionmentCriterion")
    names = {
        (criterion.condominium.name, criterion.position): criterion.name
        for criterion in criterion_model.objects.select_related("condominium")
    }
    assert names == {
        ("Sol", 1): "Geral",
        ("Sol", 2): "Fração 2",
        ("Sol", 4): "Fração 4",
        ("Sol", 5): "Fração 5",  # nobody had a 5th fraction, but a plan item named it
        (
            "Lua",
            1,
        ): "Geral",  # a condominium with no fractions still has its main criterion
    }
    fraction_model: Any = new_apps.get_model("condominiums", "UnitFraction")
    rows = {
        (row.unit.name, row.criterion.position): row.value
        for row in fraction_model.objects.select_related("unit", "criterion")
    }
    assert rows == {
        ("1", 1): Decimal("0.6"),
        ("1", 2): Decimal("0.3"),
        ("2", 1): Decimal("0.4"),
        ("2", 4): Decimal("0.2"),
    }
    item_model: Any = new_apps.get_model("billing", "BillingPlanItem")
    by_description = {
        item.description: item.apportionment_criterion
        for item in item_model.objects.all()
    }
    assert by_description["Item 1"].position == 2
    assert by_description["Item 2"].position == 5
    assert by_description["Item 3"] is None
    assert first.pk and second.pk and items
