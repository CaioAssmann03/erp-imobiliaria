"""The migrations of spec 043 on rows that already exist (R2, R4).

Each test goes back to the schema where the address still lived in `condominiums`, creates rows with
the historical models, migrates forward and checks what they became. The schema is brought back to
the latest migration afterwards, so the other tests find the tables they expect.
"""

from collections.abc import Iterator
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

from apps.core.testing import SEEDED_COMPANY_CNPJ

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("core", "0002_seed_company"), ("condominiums", "0013_literal_apportionment_names")]


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


def old_addresses(apps: StateApps) -> tuple[Any, Any, Any]:
    """A condominium with an address, and an address nobody points at."""
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"}
    )
    address_model: Any = apps.get_model("condominiums", "Address")
    used = address_model.objects.create(street="Rua A", number="10", city="Curitiba", state="PR")
    orphan = address_model.objects.create(city="Londrina")
    condominium: Any = apps.get_model("condominiums", "Condominium").objects.create(
        company=company, name="Sol", cnpj="11222333000181", address=used
    )
    return company, used, orphan if condominium else None


def test_each_address_takes_the_company_of_its_condominium_and_an_orphan_is_removed() -> None:
    company, used, _ = old_addresses(migrate(BEFORE))

    new_apps = migrate(latest())

    address: Any = new_apps.get_model("core", "Address").objects.get()
    assert (address.pk, address.company_id) == (used.pk, company.pk)
    assert (address.street, address.number, address.city, address.state) == ("Rua A", "10", "Curitiba", "PR")
    condominium: Any = new_apps.get_model("condominiums", "Condominium").objects.get()
    assert condominium.address_id == used.pk
    assert "address" in tables()
    assert "condominiums_address" not in tables()


def test_the_content_type_moves_to_core_with_its_id() -> None:
    migrate(BEFORE)
    content_type_model: Any = MigrationExecutor(connection).loader.project_state(BEFORE).apps.get_model(
        "contenttypes", "ContentType"
    )
    content_type, _ = content_type_model.objects.get_or_create(app_label="condominiums", model="address")

    _ = migrate(latest())

    assert content_type_model.objects.get(app_label="core", model="address").pk == content_type.pk
    assert not content_type_model.objects.filter(app_label="condominiums", model="address").exists()


def test_going_back_restores_the_old_table_and_keeps_the_used_address() -> None:
    _, used, _ = old_addresses(migrate(BEFORE))
    _ = migrate(latest())

    back_apps = migrate(BEFORE)

    assert "condominiums_address" in tables()
    assert "address" not in tables()
    assert back_apps.get_model("condominiums", "Address").objects.get().pk == used.pk
