from typing import final

from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from apps.core.scoping import CompanyScopedAdminMixin

from .models import BillingPlan, BillingPlanItem


@final
class BillingPlanItemInline(CompanyScopedAdminMixin, TabularInline):
    model = BillingPlanItem
    extra = 0
    ordering = ("position",)


@final
@admin.register(BillingPlan)
class BillingPlanAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("name", "condominium", "active", "start_month", "end_month")
    search_fields = ("name", "condominium__name")
    list_filter = ("active", "condominium")
    inlines = (BillingPlanItemInline,)
