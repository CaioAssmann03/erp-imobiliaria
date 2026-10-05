import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.finance.error_codes import FinanceErrorCode as Code

from apps.core.validators import validate_percentage
from apps.finance.models.cost_center import CostCenter


COST_CENTER_IS_FIXED = "The cost center of an entry template cannot be changed."


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

    # Path from the model to its company (spec 004: company scoping).
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
                violation_error_message="Percentage must be between 0 and 100.",
                violation_error_code=Code.ENTRY_TEMPLATE_ADMIN_FEE_PERCENTAGE_OUT_OF_RANGE.value,
            ),
            models.UniqueConstraint(
                fields=("cost_center", "name"),
                name="entry_template_unique_name_per_cost_center",
                violation_error_message="This cost center already has an entry template with this name.",
                violation_error_code=Code.ENTRY_TEMPLATE_NAME_DUPLICATE_IN_COST_CENTER.value,
            ),
        )

    @override
    def clean(self) -> None:
        """The cost center is fixed once the template exists (ledger entries group by it)."""
        if self._state.adding:
            return
        stored_cost_center_id = (
            type(self).objects.filter(pk=self.pk).values_list("cost_center_id", flat=True).first()
        )
        if stored_cost_center_id is not None and stored_cost_center_id != self.cost_center_id:
            raise ValidationError(
                {
                    "cost_center": ValidationError(
                        COST_CENTER_IS_FIXED, code=Code.ENTRY_TEMPLATE_COST_CENTER_IMMUTABLE.value
                    )
                }
            )

    @override
    def __str__(self) -> str:
        return f"{self.cost_center} - {self.name}"
