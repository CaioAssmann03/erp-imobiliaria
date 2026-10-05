"""OpenAPI: the audited JWT authentication is documented as the SimpleJWT scheme (spec 005)."""

from drf_spectacular.contrib.rest_framework_simplejwt import SimpleJWTScheme


class AuditedJWTScheme(SimpleJWTScheme):  # type: ignore[no-untyped-call]
    target_class = "apps.accounts.authentication.AuditedJWTAuthentication"
    name = "jwtAuth"
