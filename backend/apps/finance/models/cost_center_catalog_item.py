from typing import TYPE_CHECKING, Any, final, override

from django.db import models, transaction
from django.db.models.functions import Lower

from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import CostCenterCatalogItemError

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .cost_center import CostCenter


@final
class CostCenterCatalogItem(BaseModel):
    """A sub-conta of the whole administradora: its code and name once (the PDF's *SubConta*, spec 053).

    A condominium uses the ones it wants (`CostCenter.catalog_item`), so the 0001 is the same Fundo de Reserva
    in every condominium. The balances stay per condominium, in each condominium's own `CostCenter`.
    """

    if TYPE_CHECKING:
        cost_centers: "RelatedManager[CostCenter]"

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="cost_center_catalog_items"
    )
    # The number the staff knows it by (0 is the *Conta Normal*); the next free one when it is left out.
    code = models.PositiveSmallIntegerField(blank=True)
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    company_lookup = "company"

    class Meta:
        verbose_name = "Cost Center Catalog Item"
        verbose_name_plural = "Cost Center Catalog"
        ordering = ("code",)
        constraints = (
            models.UniqueConstraint(
                fields=("company", "code"),
                name="cost_center_catalog_item_unique_code_per_company",
                violation_error_message=CostCenterCatalogItemError.CODE_DUPLICATE_IN_COMPANY.message,
                violation_error_code=CostCenterCatalogItemError.CODE_DUPLICATE_IN_COMPANY.value,
            ),
            models.UniqueConstraint(
                "company",
                Lower("name"),
                name="cost_center_catalog_item_unique_name_per_company",
                violation_error_message=CostCenterCatalogItemError.NAME_DUPLICATE_IN_COMPANY.message,
                violation_error_code=CostCenterCatalogItemError.NAME_DUPLICATE_IN_COMPANY.value,
            ),
        )

    @classmethod
    def next_code_in(cls, company_id: Any) -> int:
        """The first code after the last one of the company (0, the *Conta Normal*, when it has none)."""
        last_code = cls.objects.filter(company_id=company_id).aggregate(last=models.Max("code"))["last"]
        return 0 if last_code is None else last_code + 1

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        with transaction.atomic():
            if self.code is None:
                # The company row is the lock that serializes two creations taking the same next code.
                _ = Company.objects.select_for_update().filter(pk=self.company_id).first()
                self.code = self.next_code_in(self.company_id)
            super().save(*args, **kwargs)
            # The sub-contas of the condominiums keep a copy of the code and the name (the ledger, the boleto
            # lines and the searches read them): the catalog is the one place that renames them.
            _ = self.cost_centers.update(code=self.code, name=self.name)

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.cost_centers.exists():
            raise CostCenterCatalogItemError.DELETION_IN_USE.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.code:04d} - {self.name}"
