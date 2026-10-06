from django.contrib import admin
from django.http import HttpRequest
from typing_extensions import final
from unfold.admin import ModelAdmin, TabularInline

from apps.core.scoping import CompanyScopedAdminMixin

from .models import (
    AccountPayable,
    BankAccount,
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
    Supplier,
)


@final
class EntryTemplateInline(CompanyScopedAdminMixin, TabularInline):
    model = EntryTemplate
    extra = 0
    show_change_link = True


@final
@admin.register(CostCenter)
class CostCenterAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("name", "condominium", "active")
    search_fields = ("name", "condominium__name")
    list_filter = ("active", "condominium")
    inlines = (EntryTemplateInline,)


@final
@admin.register(EntryTemplate)
class EntryTemplateAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("name", "cost_center", "active", "admin_fee_incidence_percentage")
    search_fields = ("name", "cost_center__name")
    list_filter = ("active", "cost_center__condominium")


@final
@admin.register(BankAccount)
class BankAccountAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("nickname", "company", "condominium", "bank_code", "kind", "active")
    search_fields = ("nickname", "bank_name")
    list_filter = ("active", "kind")


@final
@admin.register(Supplier)
class SupplierAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("person", "active")
    search_fields = ("person__name",)
    list_filter = ("active",)
    raw_id_fields = ("person",)


@final
@admin.register(AccountPayable)
class AccountPayableAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("description", "supplier", "condominium", "amount", "due_date", "status")
    search_fields = ("description", "document_number", "supplier__person__name")
    list_filter = ("status", "condominium")
    date_hierarchy = "due_date"
    raw_id_fields = ("supplier",)
    # The life cycle (status and payment) changes through settle/cancel, not by hand.
    readonly_fields = ("status", "payment_date", "amount_paid", "payment_method")


@final
@admin.register(CurrentAccount)
class CurrentAccountAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("condominium", "balance")
    search_fields = ("condominium__name",)
    # The balance moves only when an entry is posted.
    readonly_fields = ("balance",)


@final
@admin.register(EntryBatch)
class EntryBatchAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("batch_date", "origin", "cash_number")
    list_filter = ("origin",)
    date_hierarchy = "batch_date"


@final
@admin.register(CurrentAccountEntry)
class CurrentAccountEntryAdmin(CompanyScopedAdminMixin, ModelAdmin):
    """Read-only: an entry is posted through the API (it moves the balance) and never changes."""

    list_display = ("registry", "current_account", "entry_date", "kind", "amount", "description")
    search_fields = ("description",)
    list_filter = ("kind", "origin")
    date_hierarchy = "entry_date"

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: CurrentAccountEntry | None = None) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: CurrentAccountEntry | None = None) -> bool:
        return False
