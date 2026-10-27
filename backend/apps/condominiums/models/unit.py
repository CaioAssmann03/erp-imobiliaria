import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import UnitError
from apps.condominiums.models.block import Block
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.querysets import UnitQuerySet
from apps.condominiums.models.rules import UnitRules
from apps.core.models.base import BaseModel

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from apps.condominiums.models.unit_apportionment_fraction import (
        UnitApportionmentFraction,
    )
    from apps.condominiums.models.unit_person import UnitPerson
    from apps.persons.models import Person


def validate_non_negative(amount: Decimal) -> None:
    if amount < 0:
        raise UnitError.UTILITY_VALUES_NEGATIVE.to_validation_error()


@final
class Unit(BaseModel):
    objects = UnitQuerySet.as_manager()

    class BillingRecipient(models.TextChoices):
        OWNER = "owner", "Owner"
        TENANT = "tenant", "Tenant"

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
        unit_people: "RelatedManager[UnitPerson]"
        fractions: "RelatedManager[UnitApportionmentFraction]"

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
    is_manager_unit = models.BooleanField(default=False)
    billing_recipient = models.CharField(
        max_length=10,
        choices=BillingRecipient.choices,
        default=BillingRecipient.OWNER,
        db_default=BillingRecipient.OWNER,
    )
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

    def billing_payer(self, reference_date: date) -> "Person | None":
        """Who pays the unit's boleto: the current tenant when the unit sends it to the tenant and has one,
        otherwise the current owner with the largest share (the earliest link on a tie); None without an owner."""
        from apps.condominiums.models.unit_person import (
            UnitPerson,  # unit_person imports this module
        )

        current_links = [
            link
            for link in self.unit_people.all()
            if link.end_date is None or link.end_date >= reference_date
        ]
        if self.billing_recipient == self.BillingRecipient.TENANT:
            tenant_links = [
                link for link in current_links if link.role == UnitPerson.Role.TENANT
            ]
            if tenant_links:
                return min(
                    tenant_links, key=lambda link: (link.start_date, str(link.pk))
                ).person
        owner_links = [
            link for link in current_links if link.role == UnitPerson.Role.OWNER
        ]
        if not owner_links:
            return None
        return min(
            owner_links,
            key=lambda link: (
                -(link.ownership_percentage or Decimal(0)),
                link.start_date,
                str(link.pk),
            ),
        ).person

    @override
    def __str__(self) -> str:
        block = f" - Block {self.block.name}" if self.block else ""
        return f"{self.condominium} - {self.name}{block}"
