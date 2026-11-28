"""The batch numbering of spec 073 on batches that already exist (R2).

Each test goes back to the schema before the number, creates batches with the historical models, migrates
forward and checks what they became. The schema is brought back to the latest migration afterwards, so the
other tests find the tables they expect.
"""

import datetime
from collections.abc import Iterator
from typing import Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.state import StateApps

from apps.core.testing import SEEDED_COMPANY_CNPJ

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("finance", "0024_case_insensitive_unique_text")]
NUMBER_ADDED = [("finance", "0025_entry_batch_number")]


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


def companies(apps: StateApps) -> tuple[Any, Any]:
    """The seeded company and a second one."""
    company_model: Any = apps.get_model("core", "Company")
    first, _ = company_model.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ, defaults={"legal_name": "ADMINISTRADORA EXEMPLO LTDA"}
    )
    second = company_model.objects.create(cnpj="11222333000181", legal_name="OUTRA ADMINISTRADORA LTDA")
    return first, second


def make_batch(apps: StateApps, company: Any, day: int, **extra: Any) -> Any:
    batch_model: Any = apps.get_model("finance", "EntryBatch")
    return batch_model.objects.create(company=company, batch_date=datetime.date(2026, 10, day), origin="bank", **extra)


def numbers_by_name(apps: StateApps, names: dict[Any, str]) -> dict[str, int]:
    batch_model: Any = apps.get_model("finance", "EntryBatch")
    return {names[batch.pk]: batch.number for batch in batch_model.objects.all() if batch.pk in names}


def test_the_batches_of_each_company_are_numbered_in_the_order_they_happened() -> None:
    apps = migrate(BEFORE)
    first, second = companies(apps)
    # Created out of order on purpose: the number follows the date, then the creation.
    third_day = make_batch(apps, first, 8)
    first_day = make_batch(apps, first, 6)
    second_day_early = make_batch(apps, first, 7)
    second_day_late = make_batch(apps, first, 7)
    elsewhere = make_batch(apps, second, 9)
    names = {
        first_day.pk: "first day",
        second_day_early.pk: "second day, created first",
        second_day_late.pk: "second day, created second",
        third_day.pk: "third day",
        elsewhere.pk: "other company",
    }

    new_apps = migrate(latest())

    assert numbers_by_name(new_apps, names) == {
        "first day": 1,
        "second day, created first": 2,
        "second day, created second": 3,
        "third day": 4,
        "other company": 1,
    }


def test_a_batch_that_already_has_a_number_keeps_it_and_the_empty_ones_follow_the_highest() -> None:
    apps = migrate(NUMBER_ADDED)
    first, _ = companies(apps)
    numbered = make_batch(apps, first, 9)
    batch_model: Any = apps.get_model("finance", "EntryBatch")
    batch_model.objects.filter(pk=numbered.pk).update(number=5)
    earlier = make_batch(apps, first, 6)
    later = make_batch(apps, first, 7)
    names = {numbered.pk: "numbered", earlier.pk: "earlier", later.pk: "later"}

    new_apps = migrate(latest())

    assert numbers_by_name(new_apps, names) == {"numbered": 5, "earlier": 6, "later": 7}


def test_going_back_leaves_the_batches_without_a_number() -> None:
    apps = migrate(latest())
    first, _ = companies(apps)
    _ = make_batch(apps, first, 6, number=1)

    old_apps = migrate(BEFORE)

    assert old_apps.get_model("finance", "EntryBatch").objects.count() == 1
