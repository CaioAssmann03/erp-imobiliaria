from apps.core.infrastructure.audit import register_audited

from .models import RentalPersonMember


def register() -> None:
    register_audited(RentalPersonMember)
