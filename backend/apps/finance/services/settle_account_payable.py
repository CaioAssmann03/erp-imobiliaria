from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db import transaction

from apps.accounts.models import User
from apps.finance.models import AccountPayable
from apps.finance.services.post_account_payable_entry import post_account_payable_entry


@dataclass(frozen=True)
class AccountPayablePayment:
    payment_date: date
    amount_paid: Decimal
    payment_method: str
    settled_by: User


@transaction.atomic
def settle_account_payable(account: AccountPayable, payment: AccountPayablePayment) -> AccountPayable:
    """Pay ("baixa") an open account; a condominium's expense posts its ledger debit in the same transaction."""
    account.lock_for_change()
    account.status = AccountPayable.Status.PAID
    account.payment_date = payment.payment_date
    account.amount_paid = payment.amount_paid
    account.payment_method = payment.payment_method
    account.full_clean()
    account.save()
    if account.condominium_id is not None:
        post_account_payable_entry(account, payment.settled_by)
    return account
