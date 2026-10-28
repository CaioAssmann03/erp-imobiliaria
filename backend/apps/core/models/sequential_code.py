from collections.abc import Collection
from typing import override

from django.db import models
from django.db.models import Func, Value


def sequential_code_field(sequence: str) -> "models.BigIntegerField[int, int]":
    return models.BigIntegerField(
        unique=True,
        editable=False,
        db_default=Func(Value(sequence), function="nextval"),
    )


class SequentialCodeMixin(models.Model):
    class Meta:
        abstract = True

    @override
    def validate_unique(self, exclude: Collection[str] | None = None) -> None:
        super().validate_unique(exclude={*(exclude or ()), "code"})
