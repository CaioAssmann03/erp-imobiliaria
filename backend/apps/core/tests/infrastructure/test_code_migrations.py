"""The migrations that number the rows that already exist (spec 019, R3).

Each test goes back to the schema before the IDs, creates rows with the historical models,
migrates forward and checks the numbers. The schema is brought back to the latest migration
afterwards, so the other tests find the tables they expect.
"""

from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

pytestmark = pytest.mark.django_db(transaction=True)

PERSONS_BEFORE = [("persons", "0004_constraint_error_codes")]
CONDOMINIUMS_BEFORE = [("condominiums", "0003_constraint_error_codes")]
SEEDED_CNPJ = "03136483000144"
SEQUENCES = {"person_code_seq", "condominium_code_seq"}


def migrate(targets: list[tuple[str, str]]) -> StateApps:
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return executor.loader.project_state(targets).apps


def latest(*apps: str) -> list[tuple[str, str]]:
    leaves = MigrationExecutor(connection).loader.graph.leaf_nodes()
    return [leaf for leaf in leaves if leaf[0] in apps]


def created_at(day: int) -> datetime:
    return datetime(2026, 1, day, tzinfo=UTC)


@pytest.fixture(autouse=True)
def restore_the_latest_schema() -> Iterator[None]:
    yield
    executor = MigrationExecutor(connection)
    executor.migrate(executor.loader.graph.leaf_nodes())


def company_of(apps: StateApps) -> Any:
    company_model: Any = apps.get_model("core", "Company")
    company, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_CNPJ, defaults={"legal_name": "SEEDED COMPANY LTDA"}
    )
    return company


def create_people_out_of_order() -> None:
    old_apps = migrate(PERSONS_BEFORE)
    person_model: Any = old_apps.get_model("persons", "Person")
    company = company_of(old_apps)
    for name, day in (("Carla", 3), ("Ana", 1), ("Bia", 2)):
        person = person_model.objects.create(company=company, name=name)
        person_model.objects.filter(pk=person.pk).update(created_at=created_at(day))


def test_existing_people_are_numbered_by_creation_order() -> None:
    create_people_out_of_order()

    new_apps = migrate(latest("persons"))

    person_model: Any = new_apps.get_model("persons", "Person")
    people = list(person_model.objects.order_by("code"))
    assert [(person.code, person.name) for person in people] == [
        (1, "Ana"),
        (2, "Bia"),
        (3, "Carla"),
    ]


def test_existing_people_become_condominiums() -> None:
    create_people_out_of_order()

    new_apps = migrate(latest("persons"))

    person_model: Any = new_apps.get_model("persons", "Person")
    assert [person.modules for person in person_model.objects.all()] == [["condominiums"]] * 3


def test_the_sequence_continues_after_the_highest_code() -> None:
    create_people_out_of_order()
    new_apps = migrate(latest("persons"))

    person_model: Any = new_apps.get_model("persons", "Person")
    next_person = person_model.objects.create(company=company_of(new_apps), name="Dani")

    assert next_person.code == 4


def test_existing_condominiums_are_numbered_by_creation_order() -> None:
    old_apps = migrate(CONDOMINIUMS_BEFORE)
    condominium_model: Any = old_apps.get_model("condominiums", "Condominium")
    company = company_of(old_apps)
    for name, cnpj, day in (("Sol", "11222333000181", 3), ("Lua", "45723174000110", 1)):
        condominium = condominium_model.objects.create(company=company, name=name, cnpj=cnpj)
        condominium_model.objects.filter(pk=condominium.pk).update(created_at=created_at(day))

    new_apps = migrate(latest("condominiums"))

    new_condominium: Any = new_apps.get_model("condominiums", "Condominium")
    assert [(row.code, row.name) for row in new_condominium.objects.order_by("code")] == [
        (1, "Lua"),
        (2, "Sol"),
    ]
    assert new_condominium.objects.create(company=company_of(new_apps), name="Mar", cnpj="11444777000161").code == 3


def test_units_get_no_code() -> None:
    new_apps = migrate(latest("condominiums"))

    unit_model: Any = new_apps.get_model("condominiums", "Unit")
    assert "code" not in {field.name for field in unit_model._meta.get_fields()}


def test_the_migrations_reverse() -> None:
    migrate(PERSONS_BEFORE + CONDOMINIUMS_BEFORE)

    with connection.cursor() as cursor:
        tables = {
            table: {column.name for column in connection.introspection.get_table_description(cursor, table)}
            for table in ("persons_person", "condominiums_condominium")
        }
        cursor.execute("SELECT relname FROM pg_class WHERE relkind = 'S'")
        sequences = {row[0] for row in cursor.fetchall()}

    assert all("code" not in columns for columns in tables.values())
    assert "modules" not in tables["persons_person"]
    assert not SEQUENCES & sequences

    migrate(latest("persons", "condominiums"))

    with connection.cursor() as cursor:
        cursor.execute("SELECT relname FROM pg_class WHERE relkind = 'S'")
        assert SEQUENCES <= {row[0] for row in cursor.fetchall()}
