import uuid
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.errors import UnitPersonError
from apps.condominiums.models.querysets import UnitPersonQuerySet
from apps.condominiums.models.rules import UnitPersonRules
from apps.condominiums.models.unit import Unit
from apps.core.models.base import BaseModel
from apps.core.validators import validate_percentage
from apps.persons.models import Person


@final
class UnitPerson(BaseModel):
    if TYPE_CHECKING:
        unit_id: uuid.UUID

        def get_role_display(self) -> str: ...

    objects = UnitPersonQuerySet.as_manager()

    class Role(models.TextChoices):
        OWNER = ("owner", "Owner")
        TENANT = ("tenant", "Tenant")

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="unit_people")
    person = models.ForeignKey(
        Person, on_delete=models.PROTECT, related_name="unit_links"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.TENANT)
    ownership_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[validate_percentage],
    )

    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    company_lookup = "unit__condominium__company"

    class Meta:
        verbose_name = "Unit Person"
        verbose_name_plural = "Unit People"
        ordering = ("-start_date", "id")
        constraints = (
            models.CheckConstraint(
                name="unit_person_and_gte_start",
                condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                violation_error_message=UnitPersonError.END_DATE_BEFORE_START_DATE.message,
                violation_error_code=UnitPersonError.END_DATE_BEFORE_START_DATE.value,
            ),
            models.CheckConstraint(
                name="unit_person_owner_percentage",
                condition=~Q(role="owner")
                | (
                    Q(ownership_percentage__isnull=False)
                    & Q(ownership_percentage__gte=0)
                    & Q(ownership_percentage__lte=100)
                ),
                violation_error_message=UnitPersonError.PERCENTAGE_REQUIRED_FOR_OWNER.message,
                violation_error_code=UnitPersonError.PERCENTAGE_REQUIRED_FOR_OWNER.value,
            ),
            models.CheckConstraint(
                name="unit_person_tenant_no_percentage",
                condition=~Q(role="tenant") | Q(ownership_percentage__isnull=True),
                violation_error_message=UnitPersonError.PERCENTAGE_NOT_ALLOWED_FOR_TENANT.message,
                violation_error_code=UnitPersonError.PERCENTAGE_NOT_ALLOWED_FOR_TENANT.value,
            ),
            models.UniqueConstraint(
                fields=("unit", "person", "role"),
                condition=Q(end_date__isnull=True),
                name="unit_person_unique_active_link",
                violation_error_message=UnitPersonError.DUPLICATE_ACTIVE_LINK.message,
                violation_error_code=UnitPersonError.DUPLICATE_ACTIVE_LINK.value,
            ),
        )

    @override
    def clean(self) -> None:
        UnitPersonRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.person} ({self.get_role_display()}) - {self.unit}"
