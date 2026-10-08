from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import PaymentReceiptError

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.payment_receipt import PaymentReceipt  # noqa: F401


class PaymentReceiptRules(ModelRules["PaymentReceipt"]):
    @rule("account_payable", PaymentReceiptError.ACCOUNT_PAYABLE_NOT_PAID)
    def account_payable_is_not_paid(self) -> bool:
        receipt = self.instance
        if receipt.account_payable_id is None:
            return False
        return receipt.account_payable.status != receipt.account_payable.Status.PAID
