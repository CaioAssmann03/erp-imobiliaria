"""Change audit trail (spec 005): who changed which registry record, personal values masked.

Each app lists its audited models in `apps/<app>/audit.py` and calls `register_audited` from
`AppConfig.ready()`. The library logs on `save()` and `delete()`; writes that bypass them
(`QuerySet.update()`, `bulk_create`, raw SQL) are not logged.
"""

from collections.abc import Sequence
from typing import Any

from auditlog.context import auditlog_value
from auditlog.registry import auditlog
from django.db.models import Model

MASKED_VALUE = "[masked]"

# Models that are deliberately not audited here, with the reason (model label -> reason).
# The finance records of phase 3 carry their own `created_by`, `created_at` and reversal entries.
AUDIT_EXEMPT: dict[str, str] = {
    "finance.CurrentAccount": "Its balance derives from the ledger entries, which never change and carry their own `created_by` and `created_at`.",
    "billing.GatewayEvent": "It is itself the record of what the gateway sent: stored as received, never edited, and its outcome is the only field processing sets.",
    "finance.CurrentAccountEntry": "It never changes and is never deleted (a mistake is fixed by an opposite entry) and carries its own `created_by` and `created_at`.",
}


def mask_personal_value(value: str) -> str:
    """The log says a personal field changed, never what it held (the library's default keeps half)."""
    return MASKED_VALUE


def register_audited(
    model: type[Model],
    masked_fields: Sequence[str] = (),
    excluded_fields: Sequence[str] = (),
) -> None:
    """Audit `model`: personal `masked_fields` are logged masked, `excluded_fields` not at all."""
    auditlog.register(
        model,
        mask_fields=list(masked_fields) or None,
        mask_callable="apps.core.infrastructure.audit.mask_personal_value" if masked_fields else None,
        exclude_fields=list(excluded_fields) or None,
    )


def is_audited(model: type[Model]) -> bool:
    return bool(auditlog.contains(model))


def set_audit_actor(user: Any) -> None:
    """Make `user` the actor of the entries written during the current request.

    The library's middleware runs before DRF authenticates, so a token request would have no
    actor; the JWT authentication class calls this once the user is known. Outside a request
    (commands, tasks) there is no audit context and nothing happens: those entries have no actor.
    """
    try:
        context_data = auditlog_value.get()
    except LookupError:
        return
    context_data["actor"] = user


def register() -> None:
    from apps.core.models import Company

    register_audited(Company)
