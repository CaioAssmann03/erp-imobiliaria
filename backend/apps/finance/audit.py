from apps.core.audit import register_audited

from .models import (
    AccountPayable,
    BankAccount,
    CostCenter,
    EntryBatch,
    EntryTemplate,
    Supplier,
)


def register() -> None:
    """The registries; bank data is logged as changed, never with its value (like personal data)."""
    register_audited(CostCenter)
    register_audited(EntryTemplate)
    register_audited(BankAccount, masked_fields=("branch", "account_number", "pix_key"))
    register_audited(Supplier, masked_fields=("bank_code", "branch", "account_number", "pix_key"))
    # Editable money records keep their history here: every change of amount or due date, with the actor.
    register_audited(AccountPayable)
    register_audited(EntryBatch)
