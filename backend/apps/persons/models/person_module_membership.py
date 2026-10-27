from typing import final, override

from django.db import models

from apps.core.models.base import BaseModel
from apps.persons.errors import PersonModuleMembershipError
from apps.persons.models.person import Person
from apps.persons.validators import validate_registered_module


@final
class PersonModuleMembership(BaseModel):
    """A person released to a module (for example `condominiums`): lists and pickers of the module offer only
    its own people. The module is a key the registry validates (`persons.modules`); there is no table per module."""

    person = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="module_memberships"
    )
    module = models.CharField(max_length=30, validators=[validate_registered_module])

    company_lookup = "person__company"

    class Meta:
        verbose_name = "Person module membership"
        verbose_name_plural = "Person module memberships"
        ordering = ("module",)
        constraints = (
            models.UniqueConstraint(
                fields=("person", "module"),
                name="person_module_membership_unique",
                violation_error_message=PersonModuleMembershipError.ALREADY_RELEASED.message,
                violation_error_code=PersonModuleMembershipError.ALREADY_RELEASED.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.person} - {self.module}"
