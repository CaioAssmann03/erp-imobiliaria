from typing import final

from django.db import models

from apps.core.models.base import BaseModel
from apps.persons.models import Person


@final
class RentalPersonMember(BaseModel):
    """A person released to the Rentals module: only these people can take part in a rental."""

    company_lookup = "person__company"

    person = models.OneToOneField(
        Person, on_delete=models.CASCADE, related_name="rental_person_member"
    )

    class Meta:
        verbose_name = "Rental person member"
        verbose_name_plural = "Rental person members"
