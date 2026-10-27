from typing import TYPE_CHECKING, Any, final, override

from django.core.exceptions import ValidationError
from django.db import models

from apps.condominiums.models import Condominium
from apps.core.models.base import BaseModel
from apps.finance.errors import CostCenterError
from apps.finance.models.querysets import CostCenterQuerySet

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .entry_template import EntryTemplate


@final
class CostCenter(BaseModel):
    objects = CostCenterQuerySet.as_manager()

    """Chart-of-accounts entry of a condominium (the PDF's *SubConta*)."""

    if TYPE_CHECKING:
        entry_templates: "RelatedManager[EntryTemplate]"

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="cost_centers"
    )
    # The number the staff knows it by (0 is the *Conta Normal*); the next free one is assigned when it is left out.
    code = models.PositiveSmallIntegerField(blank=True)
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Cost Center"
        verbose_name_plural = "Cost Centers"
        ordering = ("condominium__name", "name")
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "code"),
                name="cost_center_unique_code_per_condominium",
                violation_error_message=CostCenterError.CODE_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=CostCenterError.CODE_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "name"),
                name="cost_center_unique_name_per_condominium",
                violation_error_message=CostCenterError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=CostCenterError.NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
        )

    @classmethod
    def next_code_in(cls, condominium_id: Any) -> int:
        """The first code after the last one of the condominium (0, the *Conta Normal*, when it has none)."""
        last_code = cls.objects.filter(condominium_id=condominium_id).aggregate(last=models.Max("code"))["last"]
        return 0 if last_code is None else last_code + 1

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.code is None:
            self.code = self.next_code_in(self.condominium_id)
        super().save(*args, **kwargs)

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
                    "condominium": CostCenterError.CONDOMINIUM_IMMUTABLE.to_validation_error()
                }
            )

    def sole_active_entry_template(self) -> "EntryTemplate | None":
        """The cost center's only active entry template; None when it has none or several."""
        templates = list(self.entry_templates.filter(active=True)[:2])
        return templates[0] if len(templates) == 1 else None

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.entry_templates.exists():
            raise CostCenterError.DELETION_HAS_ENTRY_TEMPLATES.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
