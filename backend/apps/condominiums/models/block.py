import uuid

from django.db import models
from typing_extensions import final, override

from apps.condominiums.error_codes import CondominiumsErrorCode as Code

from apps.condominiums.models.condominium import Condominium


@final
class Block(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="blocks"
    )

    name = models.CharField(max_length=60)

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Block"
        verbose_name_plural = "Blocks"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "name"),
                name="block_unique_name_per_condominium",
                violation_error_message="This condominium already has a block with this name.",
                violation_error_code=Code.BLOCK_NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"Block {self.name} of {self.condominium}"
