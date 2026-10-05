import uuid

from django.core.exceptions import ValidationError
from django.db import models
from typing_extensions import final, override

from apps.finance.error_codes import FinanceErrorCode as Code
from apps.finance.validators import validate_bank_code
from apps.persons.models import Person

from .bank_account import AccountKind

BANK_DATA_TOGETHER = "Bank code, branch and account number must be filled together."


@final
class Supplier(models.Model):
    """Who the company pays (the PDF's *Fornecedor*): a `Person` plus how to pay them."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.OneToOneField(Person, on_delete=models.PROTECT, related_name="supplier")

    # Payment data, all optional: a supplier paid by boleto has none; a PIX key may stand alone.
    bank_code = models.CharField(max_length=3, blank=True, validators=[validate_bank_code])
    branch = models.CharField(max_length=10, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_kind = models.CharField(max_length=10, blank=True, choices=AccountKind.choices)
    pix_key = models.CharField(max_length=140, blank=True)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "person__company"

    class Meta:
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
        ordering = ("person__name",)

    @override
    def clean(self) -> None:
        """Bank code, branch and account number are filled together or not at all."""
        bank_data = {
            "bank_code": self.bank_code,
            "branch": self.branch,
            "account_number": self.account_number,
        }
        if not any(bank_data.values()) or all(bank_data.values()):
            return
        raise ValidationError(
            {
                field: ValidationError(BANK_DATA_TOGETHER, code=Code.SUPPLIER_BANK_DATA_INCOMPLETE.value)
                for field, value in bank_data.items()
                if not value
            }
        )

    @override
    def __str__(self) -> str:
        return str(self.person)
