from django.db import models
from typing_extensions import final, override

from .person import Person


@final
class PeopleLegal(models.Model):
    person = models.OneToOneField(
        Person, on_delete=models.CASCADE, primary_key=True, related_name="people_legal"
    )

    cnpj = models.CharField(max_length=14, unique=True)
    ie = models.CharField(max_length=20, blank=True, null=True)

    @final
    class Meta:
        verbose_name = "Legal"
        verbose_name_plural = "Legals"

    @override
    def __str__(self) -> str:
        return self.cnpj
