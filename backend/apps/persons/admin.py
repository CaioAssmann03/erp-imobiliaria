from typing import Any, final, override

from django.contrib import admin
from django.http import HttpRequest
from unfold.admin import StackedInline

from apps.core.infrastructure.admin_base import MetriModelAdmin
from apps.core.infrastructure.scoping import CompanyScopedAdminMixin
from apps.core.infrastructure.soft_delete_admin import (
    ArchivedAction,
    ArchivedListFilter,
    SoftDeleteAdminMixin,
)

from .models import PeopleIndividual, PeopleLegal, Person
from .services.anonymize_person import anonymize_person


@final
class PeopleIndividualInline(StackedInline):
    model = PeopleIndividual
    extra = 0
    tab = True
    verbose_name_plural = "Pessoa física (CPF)"
    exclude = ("company",)  # copied from the person in `PersonAdmin.save_formset`


@final
class PeopleLegalInline(StackedInline):
    model = PeopleLegal
    extra = 0
    tab = True
    verbose_name_plural = "Pessoa jurídica (CNPJ)"
    exclude = ("company",)  # copied from the person in `PersonAdmin.save_formset`


@final
@admin.register(Person)
class PersonAdmin(CompanyScopedAdminMixin, SoftDeleteAdminMixin, MetriModelAdmin):
    archived_label = "Pessoas"
    archived_actions = (ArchivedAction("anonymize", "Anonimizar", anonymize_person),)
    list_display = ("code", "name", "get_cpf", "get_cnpj", "active")
    list_filter = ("active", ArchivedListFilter)
    hide_on_add = ("code", "anonymized_at")
    readonly_fields = ("code", "anonymized_at")
    search_help_text = "Busque pelo código, nome, e-mail, CPF ou CNPJ."
    fieldsets = (
        ("Dados", {"fields": ("code", "name", "company", "active", "anonymized_at"), "classes": ["tab"]}),
        ("Contato", {"fields": ("email", "cell_number", "home_phone", "business_phone"), "classes": ["tab"]}),
    )
    search_fields = ("=code", "name", "email", "people_individual__cpf", "people_legal__cnpj")
    list_select_related = ("people_individual", "people_legal")
    inlines = (PeopleIndividualInline, PeopleLegalInline)

    @override
    def save_formset(self, request: HttpRequest, form: Any, formset: Any, change: bool) -> None:
        """The documents' company is the person's company."""
        for document in formset.save(commit=False):
            document.company_id = form.instance.company_id
            document.save()
        for deleted in formset.deleted_objects:
            deleted.delete()

    @admin.display(description="CPF")
    def get_cpf(self, person: Person) -> str:
        individual = getattr(person, "people_individual", None)
        return individual.cpf if individual else "-"

    @admin.display(description="CNPJ")
    def get_cnpj(self, person: Person) -> str:
        legal = getattr(person, "people_legal", None)
        return legal.cnpj if legal else "-"
