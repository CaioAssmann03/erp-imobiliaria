from apps.core.infrastructure.audit import register_audited

from .models import User


def register() -> None:
    """The credential's secrets never reach the log."""
    register_audited(User, excluded_fields=("password", "last_login"))
