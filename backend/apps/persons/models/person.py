import uuid
from typing import TYPE_CHECKING

from django.db import models
from typing_extensions import final, override

from .people_individual import PeopleIndividual
from .people_legal import PeopleLegal


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
