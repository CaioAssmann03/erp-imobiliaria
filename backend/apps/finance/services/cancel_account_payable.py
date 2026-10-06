from django.db import transaction

from apps.finance.models import AccountPayable


@transaction.atomic
def cancel_account_payable(account: AccountPayable) -> AccountPayable:
    """Cancel an open account."""
    account.lock_for_change()
    account.status = AccountPayable.Status.CANCELLED
    account.full_clean()
    account.save()
    return account
