from collections.abc import Collection

from django.db import models
from django.db.models import Func, Value
from typing_extensions import override


def sequential_code_field(sequence: str) -> "models.BigIntegerField[int, int]":
    """The "ID" users type and search by: a number the database takes from `sequence` on insert."""
    return models.BigIntegerField(
        unique=True,
        editable=False,
        db_default=Func(Value(sequence), function="nextval"),
    )


class SequentialCodeMixin(models.Model):
    """Abstract base of a model that declares `code = sequential_code_field(...)`.

    Django's own uniqueness check would evaluate the database default, which draws a number from
    the sequence on every `full_clean()` and leaves holes; the unique index is the guarantee.
    """

    class Meta:
        abstract = True

    @override
    def validate_unique(self, exclude: Collection[str] | None = None) -> None:
        super().validate_unique(exclude={*(exclude or ()), "code"})
