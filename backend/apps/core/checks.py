"""System checks (spec 008)."""

from typing import Any

from django.conf import settings
from django.core.checks import CheckMessage, Tags, Warning, register

DEFAULT_ADMIN_URL = "admin/"


@register(Tags.security)
def check_admin_url_is_not_the_default(app_configs: Any, **kwargs: Any) -> list[CheckMessage]:
    """In production the admin should not sit on the default public path (obscurity, not security)."""
    if settings.DEBUG or settings.ADMIN_URL != DEFAULT_ADMIN_URL:
        return []
    return [
        Warning(
            "The Django Admin is served on the default /admin/ path.",
            hint="Set ADMIN_URL to a non-obvious path (for example 'gestao-interna/').",
            id="core.W001",
        )
    ]
