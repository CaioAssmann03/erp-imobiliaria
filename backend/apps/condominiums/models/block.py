from typing import final, override

from django.db import models
from django.db.models import Q

from apps.condominiums.errors import BlockError
from apps.condominiums.models.condominium import Condominium
from apps.condominiums.models.querysets import BlockQuerySet
from apps.core.models import SoftDeleteManager, SoftDeleteMixin
from apps.core.models.base import UUIDModel


@final
class Block(SoftDeleteMixin, UUIDModel):
    objects = SoftDeleteManager.from_queryset(BlockQuerySet)()
    all_objects = BlockQuerySet.as_manager()

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="blocks"
    )

    name = models.CharField(max_length=60)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Block"
        verbose_name_plural = "Blocks"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "name"),
                condition=Q(deleted_at__isnull=True),
                name="block_unique_name_per_condominium",
                violation_error_message=BlockError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=BlockError.NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
        )

    @override
    def validate_archivable(self) -> None:
        from .rules.block_archive import BlockArchiveRules  # the rules package imports the condominium module

        BlockArchiveRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"Block {self.name} of {self.condominium}"
