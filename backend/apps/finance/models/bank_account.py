from typing import final, override

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import BankAccountError
from apps.finance.validators import validate_bank_code


class AccountKind(models.TextChoices):
    CHECKING = ("checking", "Checking")
    SAVINGS = ("savings", "Savings")


@final
class BankAccount(BaseModel):
    """A real bank account (the PDF's *ContaBancaria*).

    `company` is the administrator that owns it. `condominium` is set only for a condominium's own
    account (the exception: boleto money lands in the company's account by default).
    """

    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="bank_accounts")
    condominium = models.ForeignKey(
        Condominium,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="bank_accounts",
    )

    bank_code = models.CharField(max_length=3, validators=[validate_bank_code])
    bank_name = models.CharField(max_length=80, blank=True)
    branch = models.CharField(max_length=10)
    account_number = models.CharField(max_length=20)
    kind = models.CharField(max_length=10, choices=AccountKind.choices, default=AccountKind.CHECKING)
    nickname = models.CharField(max_length=60, blank=True, help_text="Ex: Conta Movimento")
    pix_key = models.CharField(max_length=140, blank=True)
    active = models.BooleanField(default=True)

    company_lookup = "company"

    class Meta:
        verbose_name = "Bank Account"
        verbose_name_plural = "Bank Accounts"
        ordering = ("company__legal_name", "nickname", "bank_code")
        constraints = (
            models.UniqueConstraint(
                fields=("company", "bank_code", "branch", "account_number"),
                condition=Q(condominium__isnull=True),
                name="bank_account_unique_company_account",
                violation_error_message=BankAccountError.ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.message,
                violation_error_code=BankAccountError.ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "bank_code", "branch", "account_number"),
                condition=Q(condominium__isnull=False),
                name="bank_account_unique_condominium_account",
                violation_error_message=BankAccountError.ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.message,
                violation_error_code=BankAccountError.ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.value,
            ),
        )

    @override
    def clean(self) -> None:
        condominium = self.condominium if self.condominium_id is not None else None
        if condominium is not None and self.company_id is not None:
            if condominium.company_id != self.company_id:
                raise ValidationError(
                    {
                        "condominium": BankAccountError.CONDOMINIUM_OTHER_COMPANY.to_validation_error()
                    }
                )

    @override
    def __str__(self) -> str:
        label = self.nickname or f"{self.bank_code} {self.branch}/{self.account_number}"
        return f"{self.condominium or self.company} - {label}"
