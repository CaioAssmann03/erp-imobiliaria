"""The data migrations of spec 046: the old `modules` arrays become membership rows (and back).

Each test goes back to the schema before the memberships, creates rows with the historical models,
migrates forward and checks the result. The schema is brought back to the latest migration
afterwards, so the other tests find the tables they expect. Delete this file once 038 is deployed.
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
SEEDED_CNPJ = "03136483000144"


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
        cnpj=SEEDED_CNPJ, defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"}
    )
    return company


def create_people_out_of_order() -> None:
    old_apps = migrate(PERSONS_BEFORE)
    person_model: Any = old_apps.get_model("persons", "Person")
    company = company_of(old_apps)
    for name, day in (("Carla", 3), ("Ana", 1), ("Bia", 2)):
        person = person_model.objects.create(company=company, name=name)
        person_model.objects.filter(pk=person.pk).update(created_at=created_at(day))


def memberships(apps: Any) -> dict[str, list[str]]:
    """Module key → names of the people released to it, in the state `apps`."""
    model: Any = apps.get_model("persons", "PersonModuleMembership")
    result: dict[str, list[str]] = {}
    for membership in model.objects.select_related("person").order_by("person__name"):
        result.setdefault(membership.module, []).append(membership.person.name)
    return result


def tables() -> set[str]:
    with connection.cursor() as cursor:
        return set(connection.introspection.table_names(cursor))


def test_existing_people_become_members_of_condominiums() -> None:
    """Specs 046 and 048: the old `modules` array (default `condominiums`) ends up as membership rows."""
    create_people_out_of_order()

    new_apps = migrate(latest("persons", "condominiums", "rentals"))

    assert memberships(new_apps) == {"condominiums": ["Ana", "Bia", "Carla"]}


def test_a_person_marked_rentals_ends_up_in_the_rentals_module() -> None:
    create_people_out_of_order()
    _ = migrate([("persons", "0005_person_code_and_modules")])
    with connection.cursor() as cursor:
        cursor.execute("UPDATE persons_person SET modules = ARRAY['rentals'] WHERE name = 'Bia'")

    new_apps = migrate(latest("persons", "condominiums", "rentals"))

    assert memberships(new_apps) == {"condominiums": ["Ana", "Carla"], "rentals": ["Bia"]}


def test_going_back_rebuilds_the_modules_array() -> None:
    """Spec 046, R7: reversing the migrations puts the memberships back in the old array."""
    new_apps = migrate(latest("persons", "condominiums", "rentals"))
    company = company_of(new_apps)
    person_model: Any = new_apps.get_model("persons", "Person")
    membership_model: Any = new_apps.get_model("persons", "PersonModuleMembership")
    both = person_model.objects.create(company=company, name="Ambas")
    renter = person_model.objects.create(company=company, name="Loc")
    nobody = person_model.objects.create(company=company, name="Nenhuma")
    _ = membership_model.objects.create(person=both, module="condominiums")
    _ = membership_model.objects.create(person=both, module="rentals")
    _ = membership_model.objects.create(person=renter, module="rentals")

    _ = migrate([("condominiums", "0008_person_member"), ("rentals", "0001_person_member")])

    with connection.cursor() as cursor:
        cursor.execute("SELECT name, modules FROM persons_person WHERE name IN ('Ambas', 'Loc', 'Nenhuma')")
        modules_by_name = {name: sorted(modules) for name, modules in cursor.fetchall()}
    assert modules_by_name == {
        "Ambas": ["condominiums", "rentals"],
        "Loc": ["rentals"],
        "Nenhuma": ["condominiums"],  # the old rule needs at least one module: it gets the old default
    }
    assert nobody.pk is not None


WITH_MEMBER_TABLES = [
    ("persons", "0006_stop_using_modules"),
    ("condominiums", "0010_apportionment_criteria"),
    ("rentals", "0002_backfill_person_members"),
]


def test_the_member_tables_are_copied_into_the_persons_table() -> None:
    """Spec 048, R5: the rows of the two member tables end up in `PersonModuleMembership`, and the tables go."""
    old_apps = migrate(WITH_MEMBER_TABLES)
    company = company_of(old_apps)
    person_model: Any = old_apps.get_model("persons", "Person")
    both = person_model.objects.create(company=company, name="Ambas")
    renter = person_model.objects.create(company=company, name="Loc")
    old_apps.get_model("condominiums", "CondominiumPersonMember").objects.create(person=both)
    old_apps.get_model("rentals", "RentalPersonMember").objects.create(person=both)
    old_apps.get_model("rentals", "RentalPersonMember").objects.create(person=renter)

    new_apps = migrate(latest("persons", "condominiums", "rentals"))

    assert memberships(new_apps) == {"condominiums": ["Ambas"], "rentals": ["Ambas", "Loc"]}
    assert not {"condominiums_condominiumpersonmember", "rentals_rentalpersonmember"} & tables()


def test_going_back_recreates_the_member_tables() -> None:
    """Spec 048, R5: reversing recreates the two tables and fills them from the single one."""
    new_apps = migrate(latest("persons", "condominiums", "rentals"))
    company = company_of(new_apps)
    person_model: Any = new_apps.get_model("persons", "Person")
    membership_model: Any = new_apps.get_model("persons", "PersonModuleMembership")
    both = person_model.objects.create(company=company, name="Ambas")
    renter = person_model.objects.create(company=company, name="Loc")
    _ = membership_model.objects.create(person=both, module="condominiums")
    _ = membership_model.objects.create(person=both, module="rentals")
    _ = membership_model.objects.create(person=renter, module="rentals")

    back_apps = migrate(WITH_MEMBER_TABLES)

    condominium_people = back_apps.get_model("condominiums", "CondominiumPersonMember").objects.values_list("person__name", flat=True)
    rental_people = back_apps.get_model("rentals", "RentalPersonMember").objects.values_list("person__name", flat=True)
    assert sorted(condominium_people) == ["Ambas"]
    assert sorted(rental_people) == ["Ambas", "Loc"]
