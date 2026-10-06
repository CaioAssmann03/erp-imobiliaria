from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import CurrentAccountError

if TYPE_CHECKING:
    from apps.finance.models.current_account import CurrentAccount  # noqa: F401


class CurrentAccountRules(ModelRules["CurrentAccount"]):
    @rule("condominium", CurrentAccountError.CONDOMINIUM_OTHER_COMPANY)
    def condominium_belongs_to_another_company(self) -> bool:
        account = self.instance
        if account.condominium_id is None or account.company_id is None:
            return False
        return account.condominium.company_id != account.company_id

    @rule("condominium", CurrentAccountError.CONDOMINIUM_IMMUTABLE)
    def condominium_changed_after_creation(self) -> bool:
        """The ledger entries group by the condominium, so it is fixed once the account exists."""
        account = self.instance
        if account._state.adding:
            return False
        stored_condominium_id = (
            type(account).objects.filter(pk=account.pk).values_list("condominium_id", flat=True).first()
        )
        return stored_condominium_id is not None and stored_condominium_id != account.condominium_id
