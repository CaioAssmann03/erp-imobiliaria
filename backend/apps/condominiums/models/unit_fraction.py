import uuid
from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import UnitError, UnitFractionError
from apps.condominiums.models.apportionment_criterion import ApportionmentCriterion
from apps.condominiums.models.rules import UnitFractionRules
from apps.condominiums.models.unit import Unit
from apps.condominiums.validators import validate_ideal_fraction
from apps.core.models.base import BaseModel


@final
class UnitFraction(BaseModel):
    """The share of one unit in one apportionment criterion, from 0 (excluded) to 1."""

    if TYPE_CHECKING:
        unit_id: uuid.UUID
        criterion_id: uuid.UUID

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="fractions")
    criterion = models.ForeignKey(
        ApportionmentCriterion, on_delete=models.RESTRICT, related_name="unit_fractions"
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
                violation_error_message=UnitFractionError.CRITERION_DUPLICATE.message,
                violation_error_code=UnitFractionError.CRITERION_DUPLICATE.value,
            ),
            models.CheckConstraint(
                name="unit_fraction_value_0_1",
                condition=Q(value__gt=0) & Q(value__lte=1),
                violation_error_message=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.message,
                violation_error_code=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.value,
            ),
        )

    @override
    def clean(self) -> None:
        UnitFractionRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.unit} - {self.criterion.name}: {self.value}"
