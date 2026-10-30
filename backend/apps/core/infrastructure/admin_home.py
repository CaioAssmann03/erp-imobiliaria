from typing import Any, cast

from django.conf import settings
from django.contrib import admin
from django.http import HttpRequest

from apps.core.infrastructure.soft_delete_admin import SoftDeleteAdminMixin


def _archived_total(request: HttpRequest) -> int:
    """How many deleted records the user may restore (shown as a badge on the Arquivados card)."""
    total = 0
    for model_admin in admin.site._registry.values():
        if isinstance(model_admin, SoftDeleteAdminMixin) and model_admin.has_change_permission(request):
            total += model_admin.get_queryset(request).filter(deleted_at__isnull=False).count()
    return total


def dashboard_callback(request: HttpRequest, context: dict[str, Any]) -> dict[str, Any]:
    """The home of the Admin (spec 063): the sidebar groups as cards, so nothing is searched in a long list."""
    context["home_groups"] = cast(dict[str, Any], settings.UNFOLD)["SIDEBAR"]["navigation"]
    context["archived_total"] = _archived_total(request)
    return context
