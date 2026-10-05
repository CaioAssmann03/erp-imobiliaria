from django.contrib.postgres.indexes import GinIndex, OpClass
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Upper
from typing_extensions import final, override

from apps.core.models import Company
from apps.core.validators import validate_cnpj
from apps.persons.error_codes import PersonsErrorCode as Code

from .person import Person


@final
class PeopleLegal(models.Model):
    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "company"

    person = models.OneToOneField(
        Person, on_delete=models.CASCADE, primary_key=True, related_name="people_legal"
    )

    # Copy of `person.company`, kept equal by `clean()`: it lets the database hold
    # "one CNPJ per company" as a constraint.
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="legals")

    cnpj = models.CharField(max_length=14, validators=[validate_cnpj])
    ie = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name = "Legal"
        verbose_name_plural = "Legals"
        constraints = (
            models.UniqueConstraint(
                fields=("company", "cnpj"),
                name="people_legal_unique_cnpj_per_company",
                violation_error_message="A person with this CNPJ already exists in this company.",
                violation_error_code=Code.PEOPLE_LEGAL_CNPJ_DUPLICATE_IN_COMPANY.value,
            ),
        )
        indexes = (
            GinIndex(
                OpClass(Upper("ie"), name="gin_trgm_ops"), name="people_legal_ie_trgm"
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
                        code=Code.PEOPLE_LEGAL_COMPANY_MISMATCH.value,
                    )
                }
            )

    @override
    def __str__(self) -> str:
        return self.cnpj
