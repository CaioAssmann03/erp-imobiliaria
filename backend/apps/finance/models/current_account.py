from decimal import Decimal
from typing import Any, final, override

from django.db import models

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import CurrentAccountError
from apps.finance.models.rules import CurrentAccountRules


@final
class CurrentAccount(BaseModel):
    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="current_accounts"
    )
    condominium = models.ForeignKey(
        Condominium, on_delete=models.PROTECT, related_name="current_accounts"
    )

    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal(0), editable=False
    )

    company_lookup = "company"

    class Meta:
        verbose_name = "Current Account"
        verbose_name_plural = "Current Accounts"
        constraints = (
            models.UniqueConstraint(
                fields=("condominium",),
                name="current_account_unique_per_condominium",
                violation_error_message=CurrentAccountError.CONDOMINIUM_DUPLICATE.message,
                violation_error_code=CurrentAccountError.CONDOMINIUM_DUPLICATE.value,
            ),
        )

    def recalculated_balance(self) -> Decimal:
        """The balance summed from the entries; the check that the cached `balance` still matches."""
        return self.entries.signed_total()

    def balances_by_cost_center(self) -> list[dict[str, object]]:
        return self.entries.balances_by_cost_center()

    @override
    def clean(self) -> None:
        CurrentAccountRules(self).validate()

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.entries.exists():
            raise CurrentAccountError.DELETION_HAS_ENTRIES.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.balance}"
