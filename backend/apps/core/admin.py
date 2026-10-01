from unfold.admin import ModelAdmin
from django.contrib import admin

from .models import Empresa


@admin.register(Empresa)
class EmpresaAdmin(ModelAdmin):
    list_display = ("razao_social", "nome_fantasia", "cnpj", "cidade", "uf", "ativo")
    search_fields = ("razao_social", "nome_fantasia", "cnpj")
    list_filter = ("ativo", "uf")
