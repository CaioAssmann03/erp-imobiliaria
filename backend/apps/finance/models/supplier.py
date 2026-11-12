from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import SoftDeleteManager, SoftDeleteMixin
from apps.core.models.base import BaseModel
from apps.finance.errors import SupplierError
from apps.finance.validators import validate_bank_code
from apps.finance.models.querysets import SupplierQuerySet
from apps.finance.models.rules.supplier_archive import SupplierArchiveRules
from apps.persons.models import Person

from .bank_account import AccountKind


@final
class Supplier(SoftDeleteMixin, BaseModel):
    """Who the company pays (the PDF's *Fornecedor*): a `Person` plus how to pay them."""

    objects = SoftDeleteManager.from_queryset(SupplierQuerySet)()
    all_objects = SupplierQuerySet.as_manager()

    person = models.OneToOneField(
        Person, on_delete=models.PROTECT, related_name="supplier"
    )

    # Payment data, all optional: a supplier paid by boleto has none; a PIX key may stand alone.
    bank_code = models.CharField(
        max_length=3, blank=True, validators=[validate_bank_code]
    )
    branch = models.CharField(max_length=10, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_kind = models.CharField(
        max_length=10, blank=True, choices=AccountKind.choices
    )
    pix_key = models.CharField(max_length=140, blank=True)

    active = models.BooleanField(default=True)

    company_lookup = "person__company"

    class Meta:
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
        ordering = ("person__code",)

    @override
    def validate_archivable(self) -> None:
        SupplierArchiveRules(self).validate()

    @override
    def clean(self) -> None:
        """Bank code, branch and account number are filled together or not at all; a person whose supplier was deleted gets it restored."""
        if self._state.adding and Supplier.all_objects.filter(person_id=self.person_id, deleted_at__isnull=False).exists():
            raise ValidationError({"person": SupplierError.PERSON_HAS_ARCHIVED_SUPPLIER.to_validation_error()})
        bank_data = {
            "bank_code": self.bank_code,
            "branch": self.branch,
            "account_number": self.account_number,
        }
        if not any(bank_data.values()) or all(bank_data.values()):
            return
        raise ValidationError(
            {
                field: SupplierError.BANK_DATA_INCOMPLETE.to_validation_error()
                for field, value in bank_data.items()
                if not value
            }
        )

    @override
    def __str__(self) -> str:
        return str(self.person)
