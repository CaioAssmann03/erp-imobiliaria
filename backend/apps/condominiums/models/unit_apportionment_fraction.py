import uuid
from collections.abc import Iterable
from decimal import Decimal
from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import UnitApportionmentFractionError, UnitError
from apps.condominiums.models.condominium_apportionment_criterion import (
    CondominiumApportionmentCriterion,
)
from apps.condominiums.models.rules import UnitApportionmentFractionRules
from apps.condominiums.models.unit import Unit
from apps.core.models.base import BaseModel


def validate_ideal_fraction(ideal_fraction: Decimal) -> None:
    if not 0 < ideal_fraction <= 1:
        raise UnitError.IDEAL_FRACTION_OUT_OF_RANGE.to_validation_error()


@final
class UnitApportionmentFraction(BaseModel):
    """The share of one unit in one apportionment criterion, from 0 (excluded) to 1."""

    if TYPE_CHECKING:
        unit_id: uuid.UUID
        criterion_id: uuid.UUID

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="fractions")
    criterion = models.ForeignKey(
        CondominiumApportionmentCriterion,
        on_delete=models.RESTRICT,
        related_name="unit_fractions",
    )
    value = models.DecimalField(
        max_digits=9, decimal_places=8, validators=[validate_ideal_fraction]
    )

    company_lookup = "unit__condominium__company"

    class Meta:
        verbose_name = "Unit fraction"
        verbose_name_plural = "Unit fractions"
        ordering = ("criterion__position",)
        constraints = (
            models.UniqueConstraint(
                fields=("unit", "criterion"),
                name="unit_fraction_unique_criterion",
                violation_error_message=UnitApportionmentFractionError.CRITERION_DUPLICATE.message,
                violation_error_code=UnitApportionmentFractionError.CRITERION_DUPLICATE.value,
            ),
            models.CheckConstraint(
                name="unit_fraction_value_0_1",
                condition=Q(value__gt=0) & Q(value__lte=1),
                violation_error_message=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.message,
                violation_error_code=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.value,
            ),
        )

    @classmethod
    def validate_distinct_criteria(cls, criterion_ids: Iterable[uuid.UUID]) -> None:
        """A unit has one fraction per criterion, so a set of fractions cannot name a criterion twice.

        The same rule as the unique constraint, for a set not yet written."""
        criterion_ids = list(criterion_ids)
        if len(criterion_ids) != len(set(criterion_ids)):
            raise UnitApportionmentFractionError.CRITERION_DUPLICATE.to_validation_error()

    @override
    def clean(self) -> None:
        UnitApportionmentFractionRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.unit} - {self.criterion.name}: {self.value}"
