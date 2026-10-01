from unfold.admin import ModelAdmin, TabularInline
from django.contrib import admin

from .models import Bloco, Condominio, Historico, SubConta, Unidade, UnidadeParte


class BlocoInline(TabularInline):
    model = Bloco
    extra = 0


@admin.register(Condominio)
class CondominioAdmin(ModelAdmin):
    list_display = ("nome", "empresa", "cidade", "uf", "tipo", "ativo")
    search_fields = ("nome", "cnpj")
    list_filter = ("empresa", "tipo", "ativo")
    inlines = [BlocoInline]


class UnidadeParteInline(TabularInline):
    model = UnidadeParte
    extra = 0
    autocomplete_fields = ["pessoa"]


@admin.register(Unidade)
class UnidadeAdmin(ModelAdmin):
    list_display = ("condominio", "bloco", "nome_unidade", "tipo", "esta_alugada", "ativo")
    search_fields = ("nome_unidade", "matricula_imovel")
    list_filter = ("condominio", "tipo", "ativo")
    inlines = [UnidadeParteInline]


@admin.register(SubConta)
class SubContaAdmin(ModelAdmin):
    list_display = ("nome", "condominio")
    list_filter = ("condominio",)


@admin.register(Historico)
class HistoricoAdmin(ModelAdmin):
    list_display = ("nome", "subconta", "ativo", "incide_previdencia")
    search_fields = ("nome",)
    list_filter = ("subconta", "ativo")
