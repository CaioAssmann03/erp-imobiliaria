import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, NamedTuple, Self

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.error_codes import CondominiumsErrorCode as Code

from apps.condominiums.models.unit import Unit
from apps.core.validators import validate_percentage
from apps.persons.models import Person


END_BEFORE_START = "End date cannot be before start date."
OWNER_NEEDS_PERCENTAGE = "Owner needs a percentage between 0 and 100."
TENANT_HAS_NO_PERCENTAGE = "Tenant cannot have an ownership percentage."


class OwnershipPeriod(NamedTuple):
    start_date: date
    end_date: date | None
    percentage: Decimal

    def covers(self, day: date) -> bool:
        return self.start_date <= day and (
            self.end_date is None or self.end_date >= day
        )


LEASE_DAYS_BEFORE = 30  # days: leases already ended that still show (renewal pending)
LEASE_DAYS_AFTER = 60  # days: leases that end soon


class UnitPersonQuerySet(models.QuerySet["UnitPerson"]):
    def current(self, reference_date: date) -> Self:
        return self.filter(Q(end_date__isnull=True) | Q(end_date__gte=reference_date))

    def leases_ending_soon(self, reference_date: date) -> Self:
        """Tenant links of active units that ended up to 30 days ago or end within 60 days."""
        return self.filter(
            role=UnitPerson.Role.TENANT,
            unit__active=True,
            end_date__isnull=False,
            end_date__gte=reference_date - timedelta(days=LEASE_DAYS_BEFORE),
            end_date__lte=reference_date + timedelta(days=LEASE_DAYS_AFTER),
        )


@final
class UnitPerson(models.Model):
    if TYPE_CHECKING:
        unit_id: uuid.UUID

        def get_role_display(self) -> str: ...

    objects = UnitPersonQuerySet.as_manager()

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
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[validate_percentage],
    )

    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "unit__condominium__company"

    class Meta:
        verbose_name = "Unit Person"
        verbose_name_plural = "Unit People"
        ordering = ("-start_date", "id")
        constraints = (
            models.CheckConstraint(
                name="unit_person_and_gte_start",
                condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                violation_error_message=END_BEFORE_START,
                violation_error_code=Code.UNIT_PERSON_END_DATE_BEFORE_START_DATE.value,
            ),
            models.CheckConstraint(
                name="unit_person_owner_percentage",
                condition=~Q(role="owner")
                | (
                    Q(ownership_percentage__isnull=False)
                    & Q(ownership_percentage__gte=0)
                    & Q(ownership_percentage__lte=100)
                ),
                violation_error_message=OWNER_NEEDS_PERCENTAGE,
                violation_error_code=Code.UNIT_PERSON_PERCENTAGE_REQUIRED_FOR_OWNER.value,
            ),
            models.CheckConstraint(
                name="unit_person_tenant_no_percentage",
                condition=~Q(role="tenant") | Q(ownership_percentage__isnull=True),
                violation_error_message=TENANT_HAS_NO_PERCENTAGE,
                violation_error_code=Code.UNIT_PERSON_PERCENTAGE_NOT_ALLOWED_FOR_TENANT.value,
            ),
            models.UniqueConstraint(
                fields=("unit", "person", "role"),
                condition=Q(end_date__isnull=True),
                name="unit_person_unique_active_link",
                violation_error_message="This person already has an active link with this role.",
                violation_error_code=Code.UNIT_PERSON_DUPLICATE_ACTIVE_LINK.value,
            ),
        )

    def is_current(self, reference_date: date) -> bool:
        return self.end_date is None or self.end_date >= reference_date

    @override
    def clean(self) -> None:
        errors: dict[str, ValidationError] = {}

        if self.role == self.Role.OWNER and self.ownership_percentage is None:
            errors["ownership_percentage"] = ValidationError(
                OWNER_NEEDS_PERCENTAGE, code=Code.UNIT_PERSON_PERCENTAGE_REQUIRED_FOR_OWNER.value
            )
        if self.role == self.Role.TENANT and self.ownership_percentage is not None:
            errors["ownership_percentage"] = ValidationError(
                TENANT_HAS_NO_PERCENTAGE,
                code=Code.UNIT_PERSON_PERCENTAGE_NOT_ALLOWED_FOR_TENANT.value,
            )
        if self.start_date and self.end_date and self.end_date < self.start_date:
            errors["end_date"] = ValidationError(
                END_BEFORE_START, code=Code.UNIT_PERSON_END_DATE_BEFORE_START_DATE.value
            )
        if self._person_belongs_to_another_company():
            errors["person"] = ValidationError(
                "Person belongs to another company.",
                code=Code.UNIT_PERSON_PERSON_OTHER_COMPANY.value,
            )
        if (
            "ownership_percentage" not in errors
            and self._owners_share_exceeds_100_percent()
        ):
            errors["ownership_percentage"] = ValidationError(
                "Owners of this unit would exceed 100% at the same time.",
                code=Code.UNIT_PERSON_PERCENTAGE_SUM_EXCEEDS_100.value,
            )
        if errors:
            raise ValidationError(errors)

    def _person_belongs_to_another_company(self) -> bool:
        if self.person_id is None or self.unit_id is None:
            return False
        return self.person.company_id != self.unit.condominium.company_id

    def _owners_share_exceeds_100_percent(self) -> bool:

        if (
            self.role != self.Role.OWNER
            or self.ownership_percentage is None
            or self.start_date is None
            or self.unit_id is None
        ):
            return False
        other_owner_links = UnitPerson.objects.filter(
            unit_id=self.unit_id, role=self.Role.OWNER
        ).exclude(pk=self.pk)
        periods = [
            OwnershipPeriod(
                link.start_date,
                link.end_date,
                link.ownership_percentage or Decimal(0),
            )
            for link in other_owner_links
        ]
        periods.append(
            OwnershipPeriod(self.start_date, self.end_date, self.ownership_percentage)
        )
        return any(
            sum(
                (p.percentage for p in periods if p.covers(period.start_date)),
                Decimal(0),
            )
            > 100
            for period in periods
        )

    @override
    def __str__(self) -> str:
        return f"{self.person} ({self.get_role_display()}) - {self.unit}"
