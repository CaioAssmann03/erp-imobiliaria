from typing import final

from django.contrib import admin
from django.http import HttpRequest
from unfold.admin import TabularInline

from apps.core.infrastructure.admin_base import MetriModelAdmin
from apps.core.infrastructure.scoping import CompanyScopedAdminMixin
from apps.core.infrastructure.soft_delete_admin import ArchivedListFilter, SoftDeleteAdminMixin

from .models import (
    AccountPayable,
    BankAccount,
    CompanyEntry,
    CostCenter,
    CostCenterCatalogItem,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
    PaymentReceipt,
    Supplier,
)


@final
class EntryTemplateInline(CompanyScopedAdminMixin, TabularInline):
    model = EntryTemplate
    extra = 0
    show_change_link = True
    tab = True
    verbose_name_plural = "Modelos de lançamento"


@final
@admin.register(CostCenter)
class CostCenterAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Sub-contas"
    list_display = ("name", "condominium", "active")
    search_fields = ("name", "condominium__name")
    readonly_fields = ("code", "name")
    list_filter = ("active", "condominium", ArchivedListFilter)
    inlines = (EntryTemplateInline,)


@final
@admin.register(CostCenterCatalogItem)
class CostCenterCatalogItemAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("code", "name", "company", "active")
    search_fields = ("name",)
    list_filter = ("active",)


@final
@admin.register(EntryTemplate)
class EntryTemplateAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("name", "cost_center", "active", "admin_fee_incidence_percentage")
    search_fields = ("name", "cost_center__name")
    list_filter = ("active", "cost_center__condominium")


@final
@admin.register(BankAccount)
class BankAccountAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("nickname", "company", "condominium", "bank_code", "kind", "active")
    search_fields = ("nickname", "bank_name")
    list_filter = ("active", "kind")


@final
@admin.register(Supplier)
class SupplierAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Fornecedores"
    list_display = ("person", "active")
    search_fields = ("person__name",)
    search_help_text = "Busque pelo nome do fornecedor."
    list_filter = ("active", ArchivedListFilter)
    raw_id_fields = ("person",)
    fieldsets = (
        ("Fornecedor", {"fields": ("person", "active"), "classes": ["tab"]}),
        ("Dados de pagamento", {"fields": ("bank_code", "branch", "account_number", "account_kind", "pix_key"), "classes": ["tab"]}),
    )


@final
@admin.register(AccountPayable)
class AccountPayableAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("description", "supplier", "condominium", "amount", "due_date", "status")
    search_fields = ("description", "document_number", "supplier__person__name")
    search_help_text = "Busque pela descrição, documento ou fornecedor."
    list_filter = ("status", "condominium")
    fieldsets = (
        ("Despesa", {"fields": ("company", "condominium", "cost_center", "supplier", "entry_template"), "classes": ["tab"]}),
        ("Conta", {"fields": ("description", "document_number", "amount", "issue_date", "due_date"), "classes": ["tab"]}),
        ("Pagamento", {"fields": ("status", "payment_date", "amount_paid", "payment_method"), "classes": ["tab"]}),
    )
    date_hierarchy = "due_date"
    raw_id_fields = ("supplier",)
    # The life cycle (status and payment) changes through settle/cancel, not by hand.
    readonly_fields = ("status", "payment_date", "amount_paid", "payment_method")


@final
@admin.register(CurrentAccount)
class CurrentAccountAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("condominium", "balance")
    search_fields = ("condominium__name",)
    # The balance moves only when an entry is posted.
    readonly_fields = ("balance",)


@final
@admin.register(EntryBatch)
class EntryBatchAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    list_display = ("batch_date", "origin", "cash_number")
    list_filter = ("origin",)
    date_hierarchy = "batch_date"


@final
@admin.register(CurrentAccountEntry)
class CurrentAccountEntryAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
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


@final
@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    """Read-only: a receipt is sent and deleted through the API, which also moves the file in the bucket."""

    list_display = ("original_name", "account_payable", "content_type", "size_bytes", "confirmed_at")
    search_fields = ("original_name", "account_payable__description")

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: PaymentReceipt | None = None) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: PaymentReceipt | None = None) -> bool:
        return False


@final
@admin.register(CompanyEntry)
class CompanyEntryAdmin(CompanyScopedAdminMixin, MetriModelAdmin):
    """Read-only: the credits of the administradora (the registration fee) are posted when a boleto is paid."""

    list_display = ("entry_date", "amount", "description")
    search_fields = ("description",)
    date_hierarchy = "entry_date"

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(
        self, request: HttpRequest, obj: CompanyEntry | None = None
    ) -> bool:
        return False

    def has_delete_permission(
        self, request: HttpRequest, obj: CompanyEntry | None = None
    ) -> bool:
        return False
