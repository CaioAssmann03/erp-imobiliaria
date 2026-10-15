from apps.accounts.models import User
from apps.finance.models import (
    AccountPayable,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
)
from apps.finance.services.post_entry import post_entry


def post_account_payable_entry(account: AccountPayable, posted_by: User) -> CurrentAccountEntry:
    """Post the debit of a paid account payable of a condominium in its current account.

    The account is created on the first posting; each payment gets its own bank batch dated
    on the payment day. Call it inside the transaction that marks the account as paid.
    """
    assert account.condominium_id is not None
    assert account.payment_date is not None
    current_account, _ = CurrentAccount.objects.get_or_create(
        condominium_id=account.condominium_id, defaults={"company_id": account.company_id}
    )
    batch = EntryBatch(
        company_id=account.company_id,
        batch_date=account.payment_date,
        origin=EntryBatch.OriginType.BANK,
    )
    batch.full_clean()
    batch.save()
    entry = CurrentAccountEntry.paying(account, current_account, batch)
    entry.created_by = posted_by
    return post_entry(entry)
