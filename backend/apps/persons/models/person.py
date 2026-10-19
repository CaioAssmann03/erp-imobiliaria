from typing import TYPE_CHECKING, final, override

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex, OpClass
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.functions import Upper

from apps.core.models import Company, SequentialCodeMixin, sequential_code_field
from apps.core.models.base import BaseModel
from apps.persons.errors import PersonError

if TYPE_CHECKING:
    from .people_individual import PeopleIndividual
    from .people_legal import PeopleLegal


class PersonModule(models.TextChoices):
    """Where a person can be used: lists and pickers of a module offer only its own people."""

    CONDOMINIUMS = ("condominiums", "Condominiums")
    RENTALS = ("rentals", "Rentals")


def default_modules() -> list[str]:
    return [PersonModule.CONDOMINIUMS.value]


@final
class Person(SequentialCodeMixin, BaseModel):
    if TYPE_CHECKING:
        people_individual: "PeopleIndividual"
        people_legal: "PeopleLegal"

    company_lookup = "company"

    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="people")
    code = sequential_code_field("person_code_seq")
    name = models.CharField(max_length=255)

    home_phone = models.CharField(max_length=20, blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    cell_number = models.CharField(max_length=20, blank=True, null=True)

    email = models.EmailField(blank=True)
    active = models.BooleanField(default=True)
    modules = ArrayField(
        models.CharField(max_length=20, choices=PersonModule.choices),
        default=default_modules,
        # Code and SQL that do not know the field yet (an old container during a deploy) keep working.
        db_default=[PersonModule.CONDOMINIUMS.value],
        blank=True,  # an empty list reaches `clean()`, which reports it with the module's own code
    )

    class Meta:
        verbose_name = "Person"
        verbose_name_plural = "Persons"
        ordering = ("name",)
        indexes = (
            GinIndex(
                OpClass(Upper("name"), name="gin_trgm_ops"), name="person_name_trgm"
            ),
            GinIndex(
                OpClass(Upper("email"), name="gin_trgm_ops"), name="person_email_trgm"
            ),
        )
        constraints = (
            models.CheckConstraint(
                name="person_modules_not_empty",
                condition=Q(modules__len__gt=0),
                violation_error_message=PersonError.MODULES_EMPTY.message,
                violation_error_code=PersonError.MODULES_EMPTY.value,
            ),
            models.CheckConstraint(
                name="person_modules_known",
                condition=Q(modules__contained_by=PersonModule.values),
                violation_error_message=PersonError.MODULES_UNKNOWN.message,
                violation_error_code=PersonError.MODULES_UNKNOWN.value,
            ),
        )

    @override
    def clean(self) -> None:
        if not self.modules:
            raise ValidationError(
                {"modules": PersonError.MODULES_EMPTY.to_validation_error()}
            )

    @override
    def __str__(self) -> str:
        return f"{self.name}"
