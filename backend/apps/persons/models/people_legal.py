from typing import final, override

from django.contrib.postgres.indexes import GinIndex, OpClass
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Upper

from apps.core.models import Company
from apps.core.infrastructure.validators import validate_cnpj
from apps.persons.errors import PeopleLegalError

from .person import Person


@final
class PeopleLegal(models.Model):
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
                violation_error_message=PeopleLegalError.CNPJ_DUPLICATE_IN_COMPANY.message,
                violation_error_code=PeopleLegalError.CNPJ_DUPLICATE_IN_COMPANY.value,
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
                    "company": PeopleLegalError.COMPANY_MISMATCH.to_validation_error()
                }
            )

    @override
    def __str__(self) -> str:
        return self.cnpj
