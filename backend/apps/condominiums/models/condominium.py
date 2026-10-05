import uuid
from typing import TYPE_CHECKING

from django.db import models
from typing_extensions import final, override

from apps.condominiums.models.address import Address
from apps.core.models import Company
from apps.core.validators import validate_cnpj
from apps.persons.models import Person

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .administration_contract import AdministrationContract
    from .billing_rules import BillingRules
    from .unit import Unit


@final
class Condominium(models.Model):
    class CondominiumType(models.TextChoices):
        RESIDENTIAL = ("residential", "Residential")
        COMMERCIAL = ("commercial", "Commercial")

    if TYPE_CHECKING:
        administration_contract: "AdministrationContract"
        billing_rules: "BillingRules"
        units: "RelatedManager[Unit]"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="company_condominium"
    )
    advisor = models.ForeignKey(
        Person,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="advisor_condominium",
    )
    address = models.OneToOneField(
        Address, on_delete=models.SET_NULL, blank=True, null=True
    )
    type = models.CharField(
        choices=CondominiumType.choices, default=CondominiumType.RESIDENTIAL
    )

    name = models.CharField(max_length=255)

    cnpj = models.CharField(max_length=14, unique=True, validators=[validate_cnpj])
    municipal_registration = models.CharField(max_length=30, blank=True, null=True)

    water_meter = models.CharField(max_length=30, blank=True, null=True)
    electricity_meter = models.CharField(max_length=30, blank=True, null=True)
    gas_meter = models.CharField(max_length=30, blank=True, null=True)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Condominium"
        verbose_name_plural = "Condominiums"
        ordering = ("name",)

    @override
    def __str__(self) -> str:
        return self.name
