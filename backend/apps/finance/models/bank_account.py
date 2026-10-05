import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from typing_extensions import final, override

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.error_codes import FinanceErrorCode as Code
from apps.finance.validators import validate_bank_code

DUPLICATE_ACCOUNT = "This holder already has an account with this bank, branch and number."
CONDOMINIUM_OTHER_COMPANY = "The condominium belongs to another company."


class AccountKind(models.TextChoices):
    CHECKING = ("checking", "Checking")
    SAVINGS = ("savings", "Savings")


@final
class BankAccount(models.Model):
    """A real bank account (the PDF's *ContaBancaria*).

    `company` is the administrator that owns it. `condominium` is set only for a condominium's own
    account (the exception: boleto money lands in the company's account by default).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Path from the model to its company (spec 004: company scoping).
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
                violation_error_message=DUPLICATE_ACCOUNT,
                violation_error_code=Code.BANK_ACCOUNT_ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.value,
            ),
            models.UniqueConstraint(
                fields=("condominium", "bank_code", "branch", "account_number"),
                condition=Q(condominium__isnull=False),
                name="bank_account_unique_condominium_account",
                violation_error_message=DUPLICATE_ACCOUNT,
                violation_error_code=Code.BANK_ACCOUNT_ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER.value,
            ),
        )

    @override
    def clean(self) -> None:
        """A condominium's own account belongs to the same company as the condominium."""
        condominium = self.condominium if self.condominium_id is not None else None
        if condominium is not None and self.company_id is not None:
            if condominium.company_id != self.company_id:
                raise ValidationError(
                    {
                        "condominium": ValidationError(
                            CONDOMINIUM_OTHER_COMPANY,
                            code=Code.BANK_ACCOUNT_CONDOMINIUM_OTHER_COMPANY.value,
                        )
                    }
                )

    @override
    def __str__(self) -> str:
        label = self.nickname or f"{self.bank_code} {self.branch}/{self.account_number}"
        return f"{self.condominium or self.company} - {label}"
