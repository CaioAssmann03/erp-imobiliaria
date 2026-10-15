"""The "ID" field (spec 019, R1): every model takes its number from its own database sequence."""

from typing import Any, cast

import pytest
from django.db import connection, models
from django.db.models import Func, Value

from apps.condominiums.models import Condominium
from apps.core.models import sequential_code_field
from apps.persons.models import Person

SEQUENCES: dict[type[models.Model], str] = {
    Person: "person_code_seq",
    Condominium: "condominium_code_seq",
}


def sequence_of(field: "models.Field[Any, Any]") -> object:
    default = cast(Func, field.db_default)
    assert default.extra["function"] == "nextval"
    return cast(Value, default.get_source_expressions()[0]).value


def test_helper_builds_the_database_sequence_field() -> None:
    field = sequential_code_field("example_seq")

    assert field.unique
    assert not field.editable
    assert sequence_of(field) == "example_seq"


@pytest.mark.parametrize("model", list(SEQUENCES))
def test_each_model_uses_its_own_sequence(model: type[models.Model]) -> None:
    field = cast("models.Field[Any, Any]", model._meta.get_field("code"))

    assert sequence_of(field) == SEQUENCES[model]
    assert field.unique
    assert not field.editable


@pytest.mark.django_db
def test_the_sequences_exist_in_the_database() -> None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT relname FROM pg_class WHERE relkind = 'S'")
        existing = {row[0] for row in cursor.fetchall()}

    assert set(SEQUENCES.values()) <= existing
