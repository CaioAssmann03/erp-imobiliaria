from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from apps.core.scoping import CompanyScopedAdminMixin

from .models import (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
    Unit,
    UnitPerson,
)


class BlockInline(TabularInline):
    model = Block
    extra = 0


class AdministrationContractInline(TabularInline):
    model = AdministrationContract
    extra = 0


class BillingRulesInline(TabularInline):
    model = BillingRules
    extra = 0


@admin.register(Address)
class AddressAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("street", "number", "city", "state", "zip_code")
    search_fields = ("street", "city", "zip_code")


@admin.register(Condominium)
class CondominiumAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("name", "company", "type", "active")
    search_fields = ("name", "cnpj")
    list_filter = ("company", "type", "active")
    raw_id_fields = ("advisor", "address")
    inlines = (BlockInline, AdministrationContractInline, BillingRulesInline)


class UnitPersonInline(CompanyScopedAdminMixin, TabularInline):
    model = UnitPerson
    extra = 0
    raw_id_fields = ("person",)


@admin.register(Unit)
class UnitAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("condominium", "block", "name", "type", "active")
    search_fields = ("name", "registration_number")
    list_filter = ("condominium", "type", "active")
    inlines = (UnitPersonInline,)
