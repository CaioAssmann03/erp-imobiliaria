import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Any, final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.condominiums.errors import CondominiumApportionmentCriterionError
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.querysets import CondominiumApportionmentCriterionQuerySet
from apps.core.models.base import BaseModel

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .unit_apportionment_fraction import UnitApportionmentFraction


@final
class CondominiumApportionmentCriterion(BaseModel):
    """One way a condominium splits its expenses (for example "Geral" or "Elevador"); each unit has a
    fraction of it (`UnitApportionmentFraction`). The criterion at position 1 is the main one: it always has to close at 1."""

    MAIN_POSITION = 1
    MAIN_NAME = "Geral"
    # The fractions of a criterion over the condominium's active units close at 1 (within the tolerance).
    TOTAL = Decimal(1)
    TOLERANCE = Decimal("0.0001")

    objects = CondominiumApportionmentCriterionQuerySet.as_manager()

    if TYPE_CHECKING:
        condominium_id: uuid.UUID
        unit_fractions: "RelatedManager[UnitApportionmentFraction]"
        billing_plan_items: "RelatedManager[Any]"
        total: Decimal  # only on what `CondominiumApportionmentCriterion.objects.with_total()` returns

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="apportionment_criteria"
    )
    name = models.CharField(max_length=100)
    position = models.PositiveSmallIntegerField()

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Apportionment criterion"
        verbose_name_plural = "Apportionment criteria"
        ordering = ("condominium__name", "position")
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "name"),
                name="apportionment_criterion_unique_name",
                violation_error_message=CondominiumApportionmentCriterionError.NAME_DUPLICATE.message,
                violation_error_code=CondominiumApportionmentCriterionError.NAME_DUPLICATE.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "position"),
                name="apportionment_criterion_unique_position",
                violation_error_message=CondominiumApportionmentCriterionError.POSITION_DUPLICATE.message,
                violation_error_code=CondominiumApportionmentCriterionError.POSITION_DUPLICATE.value,
            ),
            models.CheckConstraint(
                name="apportionment_criterion_position_from_1",
                condition=Q(position__gte=1),
                violation_error_message=CondominiumApportionmentCriterionError.POSITION_OUT_OF_RANGE.message,
                violation_error_code=CondominiumApportionmentCriterionError.POSITION_OUT_OF_RANGE.value,
            ),
        )

    @classmethod
    def next_position_in(cls, condominium: Condominium) -> int:
        """The first position after the last one of the condominium (1 when it has none)."""
        last_position = cls.objects.filter(condominium=condominium).aggregate(last=models.Max("position"))["last"]
        return (last_position or 0) + 1

    @property
    def is_main(self) -> bool:
        return self.position == self.MAIN_POSITION

    @classmethod
    def does_not_close(cls, total: Decimal) -> bool:
        """Whether a sum of fractions is not 1 (more than the tolerance away from it)."""
        return abs(total - cls.TOTAL) > cls.TOLERANCE

    def is_inconsistent(self, total: Decimal) -> bool:
        """Whether this criterion has a pendency given the sum of its fractions over the active units:
        the main one always has to close at 1, the others only once in use (a sum above 0)."""
        return (self.is_main or total != 0) and self.does_not_close(total)

    @override
    def clean(self) -> None:
        stored_condominium_id = (
            type(self)
            .objects.filter(pk=self.pk)
            .values_list("condominium_id", flat=True)
            .first()
        )
        if stored_condominium_id is not None and stored_condominium_id != self.condominium_id:
            raise ValidationError(
                {"condominium": CondominiumApportionmentCriterionError.CONDOMINIUM_IMMUTABLE.to_validation_error()}
            )

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.is_main:
            raise CondominiumApportionmentCriterionError.DELETION_IS_MAIN.to_validation_error()
        if self.unit_fractions.exists() or self.billing_plan_items.exists():
            raise CondominiumApportionmentCriterionError.DELETION_IN_USE.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
