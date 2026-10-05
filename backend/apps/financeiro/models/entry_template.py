import uuid

from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.core.validators import validate_percentage
from apps.financeiro.models.cost_center import CostCenter


@final
class EntryTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=120)
    cost_center = models.ForeignKey(
        CostCenter, on_delete=models.PROTECT, related_name="entry_templates"
    )
    active = models.BooleanField(default=True)

    has_accumulation_history = models.BooleanField(default=False)
    accumulate_to_balance = models.BooleanField(default=True)
    is_subject_to_social_security = models.BooleanField(default=False)
    admin_fee_incidence_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[validate_percentage]
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Entry Template"
        verbose_name_plural = "Entry Templates"
        constraints = (
            models.CheckConstraint(
                name="entry_template_admin_fee_pct_0_100",
                condition=Q(admin_fee_incidence_percentage__gte=0)
                & Q(admin_fee_incidence_percentage__lte=100),
                violation_error_message="Percentage must be between 0 and 100",
            ),
            models.UniqueConstraint(
                fields=("cost_center", "name"),
                name="entry_template_unique_name_per_cost_center",
                violation_error_message="This coast center already has an entry template with this name",
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.cost_center} - {self.name}"
