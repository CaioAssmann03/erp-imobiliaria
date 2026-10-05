from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.core.models import Company
from apps.core.validators import validate_cpf
from apps.persons.error_codes import PersonsErrorCode as Code

from .person import Person


@final
class PeopleIndividual(models.Model):
    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "company"

    person = models.OneToOneField(
        Person,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="people_individual",
    )
    # Copy of `person.company`, kept equal by `clean()`: it lets the database hold
    # "one CPF per company" as a constraint.
    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="individuals"
    )

    cpf = models.CharField(max_length=11, validators=[validate_cpf])
    rg = models.CharField(max_length=10, blank=True, null=True)

    birthday = models.DateField(blank=True, null=True)
    marital_status = models.CharField(max_length=30, blank=True, null=True)
    job = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        verbose_name = "Individual"
        verbose_name_plural = "Individuals"
        constraints = (
            models.UniqueConstraint(
                fields=("company", "cpf"),
                name="people_individual_unique_cpf_per_company",
                violation_error_message="A person with this CPF already exists in this company.",
                violation_error_code=Code.PEOPLE_INDIVIDUAL_CPF_DUPLICATE_IN_COMPANY.value,
            ),
            models.UniqueConstraint(
                fields=("company", "rg"),
                condition=Q(rg__isnull=False),
                name="people_individual_unique_rg_per_company",
                violation_error_message="A person with this RG already exists in this company.",
                violation_error_code=Code.PEOPLE_INDIVIDUAL_RG_DUPLICATE_IN_COMPANY.value,
            ),
        )

    @override
    def clean(self) -> None:
        """The document's company is the person's company (filled in when absent)."""
        if self.person_id is None:
            return
        if self.company_id is None:
            self.company_id = self.person.company_id
        elif self.company_id != self.person.company_id:
            raise ValidationError(
                {
                    "company": ValidationError(
                        "The document must belong to the same company as the person.",
                        code=Code.PEOPLE_INDIVIDUAL_COMPANY_MISMATCH.value,
                    )
                }
            )

    @override
    def __str__(self) -> str:
        return self.cpf
