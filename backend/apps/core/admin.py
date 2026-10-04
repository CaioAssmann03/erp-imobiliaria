from django.contrib import admin
from typing_extensions import final
from unfold.admin import ModelAdmin

from .models import Company


@final
@admin.register(Company)
class CompanyAdmin(ModelAdmin):
    list_display = ("legal_name", "trade_name", "cnpj", "city", "state", "active")
    search_fields = ("legal_name", "trade_name", "cnpj")
    list_filter = ("active", "state")
