import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.condominiums.errors import UnitError
from apps.condominiums.models.block import Block
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.querysets import UnitQuerySet
from apps.condominiums.models.rules import UnitRules
from apps.condominiums.validators import validate_ideal_fraction, validate_non_negative
from apps.core.models import SequentialCodeMixin, sequential_code_field
from apps.core.models.base import BaseModel


@final
class Unit(SequentialCodeMixin, BaseModel):
    APPORTIONMENT_TOTAL = Decimal(1)
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

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="units"
    )
    block = models.ForeignKey(
        Block, on_delete=models.RESTRICT, related_name="units", blank=True, null=True
    )
    code = sequential_code_field("unit_code_seq")

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

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"
        ordering = ("condominium__name", "block__name", "name")
        constraints = (
            models.CheckConstraint(
                name="unit_ideal_fraction_0_1",
                condition=Q(ideal_fraction__isnull=True)
                | (Q(ideal_fraction__gt=0) & Q(ideal_fraction__lte=1)),
                violation_error_message=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.message,
                violation_error_code=UnitError.IDEAL_FRACTION_OUT_OF_RANGE.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "block", "name"),
                name="unit_unique_per_block",
                violation_error_message=UnitError.NAME_DUPLICATE_IN_BLOCK.message,
                violation_error_code=UnitError.NAME_DUPLICATE_IN_BLOCK.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "name"),
                condition=Q(block__isnull=True),
                name="unit_unique_per_condominium",
                violation_error_message=UnitError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=UnitError.NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.CheckConstraint(
                name="unit_values_non_negative",
                condition=Q(gas_value__gte=0)
                & Q(water_value__gte=0)
                & Q(electricity_value__gte=0),
                violation_error_message=UnitError.UTILITY_VALUES_NEGATIVE.message,
                violation_error_code=UnitError.UTILITY_VALUES_NEGATIVE.value,
            ),
        )

    @override
    def clean(self) -> None:
        UnitRules(self).validate()

    @override
    def __str__(self) -> str:
        block = f" - Block {self.block.name}" if self.block else ""
        return f"{self.condominium} - {self.name}{block}"
