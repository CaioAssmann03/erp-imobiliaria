import uuid

from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.models.unit import Unit
from apps.persons.models import Person


@final
class UnitPerson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Role(models.TextChoices):
        OWNER = ("owner", "Owner")
        TENANT = ("tenant", "Tenant")

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="unit_people")
    person = models.ForeignKey(
        Person, on_delete=models.PROTECT, related_name="unit_links"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.TENANT)
    ownership_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )

    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Unit Person"
        verbose_name_plural = "Unit People"
        constraints = (
            models.CheckConstraint(
                name="unit_person_and_gte_start",
                condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                violation_error_message="End date cannot be before start date",
            ),
            models.CheckConstraint(
                name="unit_person_owner_percentage",
                condition=~Q(role="owner")
                | (Q(ownership_percentage__gte=0) & Q(ownership_percentage__lte=100)),
                violation_error_message="Owner needs a percentage between 0 and 100",
            ),
            models.CheckConstraint(
                name="unit_person_tenant_no_percentage",
                condition=~Q(role="tenant") | Q(ownership_percentage__isnull=True),
                violation_error_message="Tenant cannot have an ownership percentage",
            ),
            models.UniqueConstraint(
                fields=("unit", "person", "role"),
                condition=Q(end_date__isnull=True),
                name="unit_person_unique_active_link",
                violation_error_message="This person already has an active link with this role",
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.person} ({self.get_role_display()}) - {self.unit}"
