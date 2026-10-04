import uuid

from django.db import models
from typing_extensions import final, override

from apps.condominiums.models import Condominium


@final
class CostCenter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="cost_centers"
    )
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = ("Cost Center",)
        verbose_name_plural = "Cost Centers"
        constraints = models.UniqueConstraint(
            fields=("condominium", "name"),
            name="cost_center_unique_name_per_condominium",
            violation_error_message="This condominium already has a cost center with this name",
        )

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
