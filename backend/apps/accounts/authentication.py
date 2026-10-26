from typing import Any, override

from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.core.infrastructure.audit import set_audit_actor


class AuditedJWTAuthentication(JWTAuthentication):
    """SimpleJWT authentication that also tells the audit trail who is acting."""

    @override
    def authenticate(self, request: Request) -> tuple[Any, Any] | None:
        result = super().authenticate(request)
        if result is not None:
            set_audit_actor(result[0])
        return result
