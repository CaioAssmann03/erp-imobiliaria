from typing import Any, final, override

from auditlog.admin import LogEntryAdmin as LibraryLogEntryAdmin
from auditlog.models import LogEntry
from django.contrib import admin
from django.http import HttpRequest
from unfold.admin import ModelAdmin

from .models import Company
from .scoping import CompanyScopedAdminMixin


@final
@admin.register(Company)
class CompanyAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("legal_name", "trade_name", "cnpj", "city", "state", "active")
    search_fields = ("legal_name", "trade_name", "cnpj")
    list_filter = ("active", "state")


admin.site.unregister(LogEntry)


@final
@admin.register(LogEntry)
class AuditLogEntryAdmin(LibraryLogEntryAdmin, ModelAdmin):
    """The audit trail: visible only to superusers (it has no company of its own), read-only for everyone."""

    @staticmethod
    def _is_superuser(request: HttpRequest) -> bool:
        return bool(request.user.is_active and request.user.is_superuser)

    @override
    def has_module_permission(self, request: HttpRequest) -> bool:
        return self._is_superuser(request)

    @override
    def has_view_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return self._is_superuser(request)

    @override
    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    @override
    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False

    @override
    def has_delete_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False
