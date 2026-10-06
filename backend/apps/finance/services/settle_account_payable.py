from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db import transaction

from apps.finance.models import AccountPayable


@dataclass(frozen=True)
class AccountPayablePayment:
    payment_date: date
    amount_paid: Decimal
    payment_method: str


@transaction.atomic
def settle_account_payable(account: AccountPayable, payment: AccountPayablePayment) -> AccountPayable:
    """Pay ("baixa") an open account."""
    account.lock_for_change()
    account.status = AccountPayable.Status.PAID
    account.payment_date = payment.payment_date
    account.amount_paid = payment.amount_paid
    account.payment_method = payment.payment_method
    account.full_clean()
    account.save()
    return account
