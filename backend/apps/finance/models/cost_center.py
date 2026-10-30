from collections.abc import Collection
from typing import TYPE_CHECKING, Any, final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.condominiums.models import Condominium
from apps.core.models import SoftDeleteManager, SoftDeleteMixin
from apps.core.models.base import BaseModel
from apps.finance.errors import CostCenterError
from apps.finance.models.cost_center_catalog_item import CostCenterCatalogItem
from apps.finance.models.querysets import CostCenterQuerySet
from apps.finance.models.rules.cost_center_archive import CostCenterArchiveRules

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .entry_template import EntryTemplate


@final
class CostCenter(SoftDeleteMixin, BaseModel):
    objects = SoftDeleteManager.from_queryset(CostCenterQuerySet)()
    all_objects = CostCenterQuerySet.as_manager()

    """Chart-of-accounts entry of a condominium (the PDF's *SubConta*)."""

    if TYPE_CHECKING:
        entry_templates: "RelatedManager[EntryTemplate]"

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="cost_centers"
    )
    # The number the staff knows it by (0 is the *Conta Normal*); the next free one is assigned when it is left out.
    code = models.PositiveSmallIntegerField(blank=True)
    name = models.CharField(max_length=120)
    # The sub-conta of the administradora's catalog this one is (spec 053). `code` and `name` above are copies kept
    # equal to the item's: the catalog is the one place that renames. Left out, the item of the same name is found
    # (or created), so code that only knows a name (seeds, tests) keeps working; the API asks for the item.
    catalog_item = models.ForeignKey(
        CostCenterCatalogItem,
        on_delete=models.PROTECT,
        related_name="cost_centers",
        blank=True,
    )
    active = models.BooleanField(default=True)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Cost Center"
        verbose_name_plural = "Cost Centers"
        ordering = ("condominium__code", "code")
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "code"),
                condition=Q(deleted_at__isnull=True),
                name="cost_center_unique_code_per_condominium",
                violation_error_message=CostCenterError.CODE_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=CostCenterError.CODE_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "name"),
                condition=Q(deleted_at__isnull=True),
                name="cost_center_unique_name_per_condominium",
                violation_error_message=CostCenterError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=CostCenterError.NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "catalog_item"),
                condition=Q(deleted_at__isnull=True),
                name="cost_center_unique_catalog_item_per_condominium",
                violation_error_message=CostCenterError.CATALOG_ITEM_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=CostCenterError.CATALOG_ITEM_DUPLICATE_IN_CONDOMINIUM.value,
            ),
        )

    def _copy_from_catalog_item(self) -> None:
        """The code and the name are the catalog item's, always."""
        if self.catalog_item_id is not None:
            self.code = self.catalog_item.code
            self.name = self.catalog_item.name

    def _find_or_create_catalog_item(self) -> CostCenterCatalogItem:
        """The company's catalog item of this name, created (with this code when it is free) when there is none."""
        company_id = self.condominium.company_id
        item = CostCenterCatalogItem.objects.filter(company_id=company_id, name__iexact=self.name.strip()).first()
        if item is not None:
            return item
        code_is_free = self.code is not None and not CostCenterCatalogItem.objects.filter(
            company_id=company_id, code=self.code
        ).exists()
        new_item = CostCenterCatalogItem(company_id=company_id, name=self.name.strip())
        if code_is_free:
            new_item.code = self.code
        new_item.save()
        return new_item

    @override
    def clean_fields(self, exclude: Collection[str] | None = None) -> None:
        self._copy_from_catalog_item()
        super().clean_fields(exclude)

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.catalog_item_id is None:
            self.catalog_item = self._find_or_create_catalog_item()
        self._copy_from_catalog_item()
        super().save(*args, **kwargs)

    @override
    def clean(self) -> None:
        """The condominium is fixed once the cost center exists (ledger entries group by it); the catalog item
        belongs to the condominium's company and, for a new cost center, is active."""
        if self.catalog_item_id is not None and self._state.adding:
            item = self.catalog_item
            if item.company_id != self.condominium.company_id:
                raise ValidationError(
                    {"catalog_item": CostCenterError.CATALOG_ITEM_OTHER_COMPANY.to_validation_error()}
                )
            if not item.active:
                raise ValidationError(
                    {"catalog_item": CostCenterError.CATALOG_ITEM_INACTIVE.to_validation_error()}
                )
        if self._state.adding:
            return
        stored = type(self).objects.filter(pk=self.pk).values("condominium_id", "catalog_item_id").first()
        if stored is None:
            return
        if stored["condominium_id"] != self.condominium_id:
            raise ValidationError({"condominium": CostCenterError.CONDOMINIUM_IMMUTABLE.to_validation_error()})
        if self.catalog_item_id is not None and stored["catalog_item_id"] != self.catalog_item_id:
            raise ValidationError({"catalog_item": CostCenterError.CATALOG_ITEM_IMMUTABLE.to_validation_error()})

    def sole_active_entry_template(self) -> "EntryTemplate | None":
        """The cost center's only active entry template; None when it has none or several."""
        templates = list(self.entry_templates.filter(active=True)[:2])
        return templates[0] if len(templates) == 1 else None

    @override
    def validate_archivable(self) -> None:
        CostCenterArchiveRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
