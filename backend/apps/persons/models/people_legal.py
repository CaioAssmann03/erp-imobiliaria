from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models.functions import Upper
from typing_extensions import final, override

from apps.core.validators import validate_cpf

from .person import Person


@final
class PeopleLegal(models.Model):
    person = models.OneToOneField(
        Person, on_delete=models.CASCADE, primary_key=True, related_name="people_legal"
    )

    cnpj = models.CharField(max_length=14, unique=True, validators=[validate_cpf])
    ie = models.CharField(max_length=20, blank=True, null=True)

    @final
    class Meta:
        verbose_name = "Legal"
        verbose_name_plural = "Legals"

        indexes = (
            GinIndex(
                OpClass(Upper("ie"), name="gin_trgm_ops"), name="people_legal_ie_trgm"
            ),
        )

    @override
    def __str__(self) -> str:
        return self.cnpj
