"""The catalog migrations of spec 053 on sub-contas that already exist (R6).

Each test goes back to the schema before the catalog, creates condominiums and sub-contas with the historical
models, migrates forward and checks what they became. The schema is brought back to the latest migration
afterwards, so the other tests find the tables they expect.
"""

from collections.abc import Iterator
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

from apps.core.testing import SEEDED_COMPANY_CNPJ

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("finance", "0016_reversal_justification_constraint")]


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


def old_world(apps: StateApps) -> tuple[Any, Any]:
    """The seeded company and a function that makes a condominium of it."""
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "ADMINISTRADORA EXEMPLO LTDA"}
    )
    condominium_model: Any = apps.get_model("condominiums", "Condominium")
    counter = iter(range(10))

    def make(name: str) -> Any:
        return condominium_model.objects.create(company=company, name=name, cnpj=f"1122233300018{next(counter)}")

    return company, make


def test_the_sub_contas_are_grouped_by_name_into_one_item_per_company() -> None:
    apps = migrate(BEFORE)
    company, make = old_world(apps)
    cost_center: Any = apps.get_model("finance", "CostCenter")
    sun, moon, star = make("Sol"), make("Lua"), make("Estrela")
    cost_center.objects.create(condominium=sun, code=0, name="Conta Normal")
    cost_center.objects.create(condominium=sun, code=1, name="Fundo de Reserva")
    cost_center.objects.create(condominium=moon, code=3, name="  fundo de reserva ")
    cost_center.objects.create(condominium=moon, code=1, name="Obras", active=False)
    cost_center.objects.create(condominium=star, code=1, name="Obras")

    new_apps = migrate(latest())

    items: Any = new_apps.get_model("finance", "CostCenterCatalogItem").objects.filter(company_id=company.pk)
    by_name = {item.name: item for item in items}
    assert set(by_name) == {"Conta Normal", "Fundo de Reserva", "Obras"}
    # The most used code of the name wins (a tie: the oldest), and a code taken by another name goes to the next free one.
    assert by_name["Conta Normal"].code == 0
    assert by_name["Fundo de Reserva"].code == 1
    assert by_name["Obras"].code == 2
    assert by_name["Obras"].active is True  # one of the two is active
    for center in new_apps.get_model("finance", "CostCenter").objects.all():
        assert center.catalog_item is not None
        assert (center.code, center.name) == (center.catalog_item.code, center.catalog_item.name)


def test_a_swap_of_codes_inside_a_condominium_does_not_meet_the_unique_code() -> None:
    apps = migrate(BEFORE)
    _, make = old_world(apps)
    cost_center: Any = apps.get_model("finance", "CostCenter")
    sun, moon = make("Sol"), make("Lua")
    # In the Sun, "B" is 0 and "A" is 1; in the Moon, "A" is 0 and "B" is 1: one name keeps its code, the other changes.
    cost_center.objects.create(condominium=sun, code=0, name="B")
    cost_center.objects.create(condominium=sun, code=1, name="A")
    cost_center.objects.create(condominium=moon, code=0, name="A")
    cost_center.objects.create(condominium=moon, code=1, name="B")

    new_apps = migrate(latest())

    centers: Any = new_apps.get_model("finance", "CostCenter").objects.all()
    for condominium_id in {center.condominium_id for center in centers}:
        codes = [center.code for center in centers if center.condominium_id == condominium_id]
        assert len(codes) == len(set(codes)) == 2


def test_the_same_name_twice_in_one_condominium_is_told_apart() -> None:
    apps = migrate(BEFORE)
    _, make = old_world(apps)
    cost_center: Any = apps.get_model("finance", "CostCenter")
    sun = make("Sol")
    cost_center.objects.create(condominium=sun, code=0, name="Garagem")
    cost_center.objects.create(condominium=sun, code=1, name="garagem")

    new_apps = migrate(latest())

    names = sorted(new_apps.get_model("finance", "CostCenter").objects.values_list("name", flat=True))
    assert names == ["Garagem", "garagem (2)"]


def test_going_back_keeps_the_columns() -> None:
    apps = migrate(BEFORE)
    _, make = old_world(apps)
    cost_center: Any = apps.get_model("finance", "CostCenter")
    sun = make("Sol")
    cost_center.objects.create(condominium=sun, code=4, name="Obras")
    migrate(latest())

    back = migrate(BEFORE)

    row: Any = back.get_model("finance", "CostCenter").objects.get()
    assert (row.code, row.name) == (4, "Obras")
