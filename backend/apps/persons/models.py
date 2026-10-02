import uuid
from typing import TYPE_CHECKING

from django.db import models
from typing_extensions import final, override


@final
class Person(models.Model):
    if TYPE_CHECKING:
        people_individual: "PeopleIndividual"  # pyright: ignore[reportUninitializedInstanceVariable]
        people_legal: "PeopleLegal"  # pyright: ignore[reportUninitializedInstanceVariable]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    home_phone = models.CharField(max_length=20, blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    cell_number = models.CharField(max_length=20, blank=True, null=True)

    email = models.EmailField(blank=True)
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @final
    class Meta:
        verbose_name = "Person"
        verbose_name_plural = "Persons"
        ordering = ("name",)

    @override
    def __str__(self) -> str:
        return f"{self.name}"


@final
class PeopleIndividual(models.Model):
    person = models.OneToOneField(
        Person,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="people_individual",
    )

    cpf = models.CharField(max_length=11, unique=True)
    rg = models.CharField(max_length=10, unique=True, blank=True, null=True)

    birthday = models.DateField(blank=True, null=True)
    marital_status = models.CharField(max_length=30, blank=True, null=True)
    job = models.CharField(max_length=120, blank=True, null=True)

    @final
    class Meta:
        verbose_name = "Individual"
        verbose_name_plural = "Individuals"

    @override
    def __str__(self) -> str:
        return self.cpf


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
