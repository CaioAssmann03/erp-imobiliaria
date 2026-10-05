import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce
from typing_extensions import final, override

from apps.condominiums.models.block import Block
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.validators import validate_ideal_fraction, validate_non_negative


class UnitQuerySet(models.QuerySet["Unit"]):
    def inconsistent_apportionment_condominium_ids(self) -> list[object]:
        """Ids of condominiums whose active units' ideal fractions do not sum to 1."""
        sums = (
            self.filter(active=True, condominium__active=True)
            .values("condominium")
            .annotate(total=Coalesce(Sum("ideal_fraction"), Decimal("0")))
        )
        return [
            row["condominium"]
            for row in sums
            if abs(row["total"] - Unit.APPORTIONMENT_TOTAL) > Unit.APPORTIONMENT_TOLERANCE
        ]


@final
class Unit(models.Model):
    # The active units of a condominium share the common areas: fractions sum to this total.
    APPORTIONMENT_TOTAL = Decimal("1")
    APPORTIONMENT_TOLERANCE = Decimal("0.0001")

    objects = UnitQuerySet.as_manager()

    class UnitType(models.TextChoices):
        APARTMENT = "apartment", "Apartment"
        OFFICE = "office", "Office"
        STORE = "store", "Store"
        HOUSE = "house", "House"
        SUITE = "suite", "Suite"
        PARKING_SPACE = "parking_space", "Parking Space"
        OTHER = "other", "Other"

    if TYPE_CHECKING:
        condominium_id: uuid.UUID

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="units"
    )
    block = models.ForeignKey(
        Block, on_delete=models.RESTRICT, related_name="units", blank=True, null=True
    )

    name = models.CharField(max_length=30, help_text="Ex.: 101")

    type = models.CharField(
        max_length=20, choices=UnitType.choices, default=UnitType.APARTMENT
    )
    resident_count = models.PositiveSmallIntegerField(default=0)
    ideal_fraction = models.DecimalField(
        max_digits=9,
        decimal_places=8,
        blank=True,
        null=True,
        validators=[validate_ideal_fraction],
        help_text="Share of common areas, from 0 to 1. Used for expanse apportionment",
    )

    is_manager_unit = models.BooleanField(default=False)
    registration_number = models.CharField(max_length=60, blank=True)

    gas_value = models.DecimalField(
        max_digits=8, decimal_places=2, default=0, validators=[validate_non_negative]
    )
    water_value = models.DecimalField(
        max_digits=8, decimal_places=2, default=0, validators=[validate_non_negative]
    )
    electricity_value = models.DecimalField(
        max_digits=8, decimal_places=2, default=0, validators=[validate_non_negative]
    )

    active = models.BooleanField(default=True)
    is_billing_blocked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"
        ordering = ("condominium__name", "block__name", "name")
        constraints = (
            models.CheckConstraint(
                name="unit_ideal_fraction_0_1",
                condition=Q(ideal_fraction__isnull=True)
                | (Q(ideal_fraction__gt=0) & Q(ideal_fraction__lte=1)),
                violation_error_message="Ideal fraction must be greater than 0 and at most 1",
            ),
            models.UniqueConstraint(
                fields=("condominium", "block", "name"), name="unit_unique_per_block"
            ),
            models.UniqueConstraint(
                fields=("condominium", "name"),
                condition=Q(block__isnull=True),
                name="unit_unique_per_condominium",
            ),
            models.CheckConstraint(
                name="unit_values_non_negative",
                condition=Q(gas_value__gte=0)
                & Q(water_value__gte=0)
                & Q(electricity_value__gte=0),
            ),
        )

    @override
    def clean(self) -> None:
        """Cross-model rules: the block belongs to the condominium; fractions never exceed the total."""
        errors: dict[str, str] = {}
        if self.block_id is not None and self.block.condominium_id != self.condominium_id:
            errors["block"] = "Block belongs to another condominium."
        if self._apportionment_exceeds_total():
            errors["ideal_fraction"] = (
                "Ideal fractions of the condominium's active units would exceed 1."
            )
        if errors:
            raise ValidationError(errors)

    def _apportionment_exceeds_total(self) -> bool:
        """The active units of a condominium cannot sum more than the total (reaching it is a pendency)."""
        if not self.active or self.ideal_fraction is None or self.condominium_id is None:
            return False
        other_units_total = (
            Unit.objects.filter(condominium_id=self.condominium_id, active=True)
            .exclude(pk=self.pk)
            .aggregate(total=Coalesce(Sum("ideal_fraction"), Decimal("0")))["total"]
        )
        limit = self.APPORTIONMENT_TOTAL + self.APPORTIONMENT_TOLERANCE
        return other_units_total + self.ideal_fraction > limit

    @override
    def __str__(self) -> str:
        block = f" - Block {self.block.name}" if self.block else ""
        return f"{self.condominium} - {self.name}{block}"
