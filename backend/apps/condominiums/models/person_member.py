from typing import final

from django.db import models

from apps.core.models.base import BaseModel
from apps.persons.models import Person


@final
class CondominiumPersonMember(BaseModel):
    """A person released to the Condominiums module: only these people can be linked to a unit."""

    company_lookup = "person__company"

    person = models.OneToOneField(
        Person, on_delete=models.CASCADE, related_name="condominium_person_member"
    )

    class Meta:
        verbose_name = "Condominium person member"
        verbose_name_plural = "Condominium person members"
