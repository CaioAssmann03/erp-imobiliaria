import uuid
from typing import TYPE_CHECKING, Any

from django.core.exceptions import ValidationError
from django.db import models
from typing_extensions import final, override

from apps.condominiums.models import Condominium
from apps.finance.error_codes import FinanceErrorCode as Code

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .entry_template import EntryTemplate

CONDOMINIUM_IS_FIXED = "The condominium of a cost center cannot be changed."
HAS_ENTRY_TEMPLATES = "This cost center has entry templates; deactivate it instead."


@final
class CostCenter(models.Model):
    """Chart-of-accounts entry of a condominium (the PDF's *SubConta*)."""

    if TYPE_CHECKING:
        entry_templates: "RelatedManager[EntryTemplate]"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="cost_centers"
    )
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Cost Center"
        verbose_name_plural = "Cost Centers"
        ordering = ("condominium__name", "name")
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "name"),
                name="cost_center_unique_name_per_condominium",
                violation_error_message="This condominium already has a cost center with this name.",
                violation_error_code=Code.COST_CENTER_NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
        )

    @override
    def clean(self) -> None:
        """The condominium is fixed once the cost center exists (ledger entries group by it)."""
        if self._state.adding:
            return
        stored_condominium_id = (
            type(self).objects.filter(pk=self.pk).values_list("condominium_id", flat=True).first()
        )
        if stored_condominium_id is not None and stored_condominium_id != self.condominium_id:
            raise ValidationError(
                {
                    "condominium": ValidationError(
                        CONDOMINIUM_IS_FIXED, code=Code.COST_CENTER_CONDOMINIUM_IMMUTABLE.value
                    )
                }
            )

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        """A cost center with entry templates is deactivated, not deleted."""
        if self.entry_templates.exists():
            raise ValidationError(
                HAS_ENTRY_TEMPLATES, code=Code.COST_CENTER_DELETION_HAS_ENTRY_TEMPLATES.value
            )
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
