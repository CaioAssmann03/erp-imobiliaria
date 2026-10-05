from django.contrib import admin
from typing_extensions import final
from unfold.admin import ModelAdmin, TabularInline

from apps.core.scoping import CompanyScopedAdminMixin

from .models import AccountPayable, BankAccount, CostCenter, EntryTemplate, Supplier


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
