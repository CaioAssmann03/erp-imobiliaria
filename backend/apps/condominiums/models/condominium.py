import uuid

from apps.condominiums.models.address import Address
from apps.core.models import Company
from apps.core.validators import validate_cnpj
from apps.persons.models import Person
from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models.functions import Upper
from typing_extensions import final, override


@final
class Condominium(models.Model):
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

    class TypeCondominium(models.TextChoices):
        RESIDENTIAL = ("residential", "Residential")
        COMMERCIAL = ("commercial", "Commercial")

    type = models.CharField(
        choices=TypeCondominium.choices, default=TypeCondominium.RESIDENTIAL
    )

    name = models.CharField(max_length=255)

    cnpj = models.CharField(max_length=14, unique=True, validators=[validate_cnpj])
    municipal_registration = models.CharField(max_length=30, blank=True, null=True)

    water_meter = models.CharField(max_length=30, blank=True, null=True)
    electricity_meter = models.CharField(max_length=30, blank=True, null=True)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Condominium"
        verbose_name_plural = "Condominiums"
        ordering = ("name",)
        indexes = (
            GinIndex(
                OpClass(Upper("name"), name="gin_trgm_ops"),
                name="condominium_name_trgm",
            ),
        )

        @override
        def __str__(self) -> str:
            return self.name
