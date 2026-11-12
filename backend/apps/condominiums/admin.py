from django.contrib import admin
from unfold.admin import TabularInline

from apps.core.infrastructure.admin_base import MetriModelAdmin
from apps.core.infrastructure.scoping import CompanyScopedAdminMixin
from apps.core.infrastructure.soft_delete_admin import ArchivedListFilter, SoftDeleteAdminMixin

from .models import (
    Block,
    Condominium,
    CondominiumAdministrationContract,
    Unit,
    UnitPerson,
)


class BlockInline(TabularInline):
    model = Block
    extra = 0
    tab = True
    verbose_name_plural = "Blocos"


class CondominiumAdministrationContractInline(TabularInline):
    model = CondominiumAdministrationContract
    extra = 0
    tab = True
    verbose_name_plural = "Contrato de administração"


@admin.register(Condominium)
class CondominiumAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Condomínios"
    list_display = ("code", "name", "type", "active")
    hide_on_add = ("code",)
    readonly_fields = ("code",)
    search_fields = ("=code", "name", "cnpj")
    search_help_text = "Busque pelo código, nome ou CNPJ."
    list_filter = ("type", "active", ArchivedListFilter)
    fieldsets = (
        ("Identificação", {"fields": ("code", "name", "cnpj", "type", "active"), "classes": ["tab"]}),
        ("Responsável e endereço", {"fields": ("company", "advisor", "address"), "classes": ["tab"]}),
        ("Medidores e inscrição", {"fields": ("municipal_registration", "water_meter", "electricity_meter", "gas_meter"), "classes": ["tab"]}),
    )
    raw_id_fields = ("advisor", "address")
    inlines = (BlockInline, CondominiumAdministrationContractInline)


class UnitPersonInline(CompanyScopedAdminMixin, TabularInline):
    model = UnitPerson
    extra = 0
    tab = True
    verbose_name_plural = "Proprietários e inquilinos"
    raw_id_fields = ("person",)


@admin.register(Unit)
class UnitAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Unidades"
    list_display = ("condominium", "block", "name", "type", "active")
    search_fields = ("name", "registration_number", "condominium__name")
    search_help_text = "Busque pelo nome da unidade, matrícula ou condomínio."
    list_filter = ("condominium", "type", "active", ArchivedListFilter)
    fieldsets = (
        ("Identificação", {"fields": ("condominium", "block", "name", "type", "active"), "classes": ["tab"]}),
        ("Cobrança", {"fields": ("billing_recipient", "is_billing_blocked", "is_manager_unit", "resident_count", "registration_number"), "classes": ["tab"]}),
        ("Consumos", {"fields": ("gas_value", "water_value", "electricity_value"), "classes": ["tab"]}),
    )
    inlines = (UnitPersonInline,)


@admin.register(Block)
class BlockAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Blocos"
    list_display = ("name", "condominium")
    list_filter = ("condominium", ArchivedListFilter)
    search_fields = ("name", "condominium__name")
