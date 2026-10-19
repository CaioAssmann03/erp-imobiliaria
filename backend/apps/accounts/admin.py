from typing import final

from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from apps.core.scoping import CompanyScopedAdminMixin

from .models import User

admin.site.unregister(Group)


@final
@admin.register(User)
class UserAdmin(CompanyScopedAdminMixin, BaseUserAdmin, ModelAdmin):  # type: ignore[type-arg]
    fieldsets = (*(BaseUserAdmin.fieldsets or ()), ("Company", {"fields": ("company",)}))
    add_fieldsets = (
        *(BaseUserAdmin.add_fieldsets or ()),
        ("Company", {"fields": ("company",)}),
    )
    list_display = ("username", "company", "email", "is_staff", "is_superuser")
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


@final
@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass
