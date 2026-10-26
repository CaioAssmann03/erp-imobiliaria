from typing import TYPE_CHECKING, final, override

from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models.functions import Upper

from apps.core.models import Company, SequentialCodeMixin, sequential_code_field
from apps.core.models.base import BaseModel
from apps.persons.models.querysets import PersonQuerySet

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .people_individual import PeopleIndividual
    from .people_legal import PeopleLegal
    from .person_module_membership import PersonModuleMembership


def default_modules() -> list[str]:
    """Kept only because migration 0005 imports it (the `modules` column is gone from the model)."""
    return ["condominiums"]


@final
class Person(SequentialCodeMixin, BaseModel):
    objects = PersonQuerySet.as_manager()

    if TYPE_CHECKING:
        people_individual: "PeopleIndividual"
        people_legal: "PeopleLegal"
        module_memberships: "RelatedManager[PersonModuleMembership]"

    company_lookup = "company"

    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="people")
    code = sequential_code_field("person_code_seq")
    name = models.CharField(max_length=255)

    home_phone = models.CharField(max_length=20, blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    cell_number = models.CharField(max_length=20, blank=True, null=True)

    email = models.EmailField(blank=True)
    active = models.BooleanField(default=True)

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

    @property
    def tax_id(self) -> str | None:
        """The CPF of an individual or the CNPJ of a legal entity (digits only); None when neither is registered."""
        individual = getattr(self, "people_individual", None)
        if individual is not None:
            return str(individual.cpf)
        legal = getattr(self, "people_legal", None)
        return str(legal.cnpj) if legal is not None else None

    @override
    def __str__(self) -> str:
        return f"{self.name}"
