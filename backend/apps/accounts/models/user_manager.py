import os
import uuid
from typing import TYPE_CHECKING, Any

from django.contrib.auth.models import UserManager as DjangoUserManager
from typing_extensions import override

from apps.core.models import Company

if TYPE_CHECKING:
    from .user import User


def default_company() -> Company:
    chosen = os.environ.get("DJANGO_SUPERUSER_COMPANY", "").strip()
    if chosen:
        try:
            return Company.objects.get(pk=uuid.UUID(chosen))
        except ValueError:
            return Company.objects.get(cnpj=chosen)
    companies = list(Company.objects.all()[:2])
    if not companies:
        raise ValueError("Create a company first: every user belongs to one.")
    if len(companies) > 1:
        raise ValueError(
            "Several companies exist: pass `company` or set DJANGO_SUPERUSER_COMPANY (an id or a CNPJ)."
        )
    return companies[0]


class UserManager(DjangoUserManager["User"]):
    @staticmethod
    def _with_company(extra_fields: dict[str, Any]) -> dict[str, Any]:
        if "company" in extra_fields or "company_id" in extra_fields:
            return extra_fields
        return {**extra_fields, "company": default_company()}

    @override
    def create_user(
        self,
        username: str,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: Any,
    ) -> "User":
        return super().create_user(
            username, email, password, **self._with_company(extra_fields)
        )

    @override
    def create_superuser(
        self,
        username: str,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: Any,
    ) -> "User":
        return super().create_superuser(
            username, email, password, **self._with_company(extra_fields)
        )
