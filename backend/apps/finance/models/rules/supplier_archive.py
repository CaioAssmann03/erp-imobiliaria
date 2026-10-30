from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import SupplierError

if TYPE_CHECKING:
    from apps.finance.models.supplier import Supplier  # noqa: F401

NOT_A_FIELD = "__all__"


class SupplierArchiveRules(ModelRules["Supplier"]):
    @rule(NOT_A_FIELD, SupplierError.ARCHIVE_HAS_OPEN_ACCOUNTS_PAYABLE)
    def has_open_accounts_payable(self) -> bool:
        accounts_payable = self.instance.accounts_payable
        return accounts_payable.filter(status=accounts_payable.model.Status.OPEN).exists()
