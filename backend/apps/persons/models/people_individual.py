from django.db import models
from typing_extensions import final, override

from apps.core.validators import validate_cpf

from .person import Person


@final
class PeopleIndividual(models.Model):
    person = models.OneToOneField(
        Person,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="people_individual",
    )

    cpf = models.CharField(max_length=11, nique=True, validators=[validate_cpf])
    rg = models.CharField(max_length=10, unique=True, blank=True, null=True)

    birthday = models.DateField(blank=True, null=True)
    marital_status = models.CharField(max_length=30, blank=True, null=True)
    job = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        verbose_name = "Individual"
        verbose_name_plural = "Individuals"

    @override
    def __str__(self) -> str:
        return self.cpf
