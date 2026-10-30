from typing import TYPE_CHECKING, Any, final, override

from django.core.exceptions import ValidationError
from django.db import models

from apps.condominiums.errors import CondominiumError
from apps.condominiums.models.querysets import CondominiumQuerySet
from apps.core.infrastructure.validators import validate_cnpj
from apps.core.models import Address, Company, SequentialCodeMixin, sequential_code_field
from apps.core.models.base import BaseModel
from apps.persons.models import Person

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .condominium_administration_contract import CondominiumAdministrationContract
    from .unit import Unit


@final
class Condominium(SequentialCodeMixin, BaseModel):
    objects = CondominiumQuerySet.as_manager()

    class CondominiumType(models.TextChoices):
        RESIDENTIAL = ("residential", "Residential")
        COMMERCIAL = ("commercial", "Commercial")

    if TYPE_CHECKING:
        administration_contract: "CondominiumAdministrationContract"
        units: "RelatedManager[Unit]"

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="company_condominium"
    )
    code = sequential_code_field("condominium_code_seq")
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

    company_lookup = "company"

    class Meta:
        verbose_name = "Condominium"
        verbose_name_plural = "Condominiums"
        ordering = ("code",)

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating:
            from .condominium_apportionment_criterion import CondominiumApportionmentCriterion

            _ = CondominiumApportionmentCriterion.objects.get_or_create(
                condominium=self,
                position=CondominiumApportionmentCriterion.MAIN_POSITION,
                defaults={"name": CondominiumApportionmentCriterion.MAIN_NAME},
            )

    @override
    def clean(self) -> None:
        advisor = self.advisor if self.advisor_id is not None else None
        if (
            advisor is not None
            and self.company_id is not None
            and advisor.company_id != self.company_id
        ):
            raise ValidationError(
                {
                    "advisor": CondominiumError.ADVISOR_OTHER_COMPANY.to_validation_error()
                }
            )

    @override
    def __str__(self) -> str:
        return self.name
