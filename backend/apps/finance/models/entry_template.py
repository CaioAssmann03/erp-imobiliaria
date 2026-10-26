from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.models.base import BaseModel
from apps.core.infrastructure.validators import validate_percentage
from apps.finance.errors import EntryTemplateError
from apps.finance.models.cost_center import CostCenter


@final
class EntryTemplate(BaseModel):

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

    company_lookup = "cost_center__condominium__company"

    class Meta:
        verbose_name = "Entry Template"
        verbose_name_plural = "Entry Templates"
        ordering = ("cost_center__condominium__name", "cost_center__name", "name")
        constraints = (
            models.CheckConstraint(
                name="entry_template_admin_fee_pct_0_100",
                condition=Q(admin_fee_incidence_percentage__gte=0)
                & Q(admin_fee_incidence_percentage__lte=100),
                violation_error_message=EntryTemplateError.ADMIN_FEE_PERCENTAGE_OUT_OF_RANGE.message,
                violation_error_code=EntryTemplateError.ADMIN_FEE_PERCENTAGE_OUT_OF_RANGE.value,
            ),
            models.UniqueConstraint(
                fields=("cost_center", "name"),
                name="entry_template_unique_name_per_cost_center",
                violation_error_message=EntryTemplateError.NAME_DUPLICATE_IN_COST_CENTER.message,
                violation_error_code=EntryTemplateError.NAME_DUPLICATE_IN_COST_CENTER.value,
            ),
        )

    @override
    def clean(self) -> None:
        """The cost center is fixed once the template exists (ledger entries group by it)."""
        if self._state.adding:
            return
        stored_cost_center_id = (
            type(self)
            .objects.filter(pk=self.pk)
            .values_list("cost_center_id", flat=True)
            .first()
        )
        if (
            stored_cost_center_id is not None
            and stored_cost_center_id != self.cost_center_id
        ):
            raise ValidationError(
                {
                    "cost_center": EntryTemplateError.COST_CENTER_IMMUTABLE.to_validation_error()
                }
            )

    @override
    def __str__(self) -> str:
        return f"{self.cost_center} - {self.name}"
