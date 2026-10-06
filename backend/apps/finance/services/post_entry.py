from django.db import transaction

from apps.finance.models import CurrentAccount, CurrentAccountEntry


@transaction.atomic
def post_entry(entry: CurrentAccountEntry) -> CurrentAccountEntry:
    """Post a ledger entry and move the balance of its account in the same transaction."""
    account = CurrentAccount.objects.select_for_update().get(
        pk=entry.current_account_id
    )
    entry.current_account = account
    entry.full_clean()
    entry.save()
    account.balance += entry.signed_amount
    account.save(update_fields=["balance", "updated_at"])
    return entry
