from unfold.admin import ModelAdmin
from django.contrib import admin

from .models import Pessoa


@admin.register(Pessoa)
class PessoaAdmin(ModelAdmin):
    list_display = ("nome", "cpf_cnpj", "tipo_pessoa", "celular", "email", "ativo")
    search_fields = ("nome", "cpf_cnpj", "email")
    list_filter = ("tipo_pessoa", "ativo")
