from typing import Any, final, override

from django.contrib import admin
from django.http import HttpRequest
from unfold.admin import ModelAdmin, StackedInline

from apps.core.infrastructure.scoping import CompanyScopedAdminMixin

from .models import PeopleIndividual, PeopleLegal, Person


@final
class PeopleIndividualInline(StackedInline):
    model = PeopleIndividual
    extra = 0
    exclude = ("company",)  # copied from the person in `PersonAdmin.save_formset`


@final
class PeopleLegalInline(StackedInline):
    model = PeopleLegal
    extra = 0
    exclude = ("company",)  # copied from the person in `PersonAdmin.save_formset`


@final
@admin.register(Person)
class PersonAdmin(CompanyScopedAdminMixin, ModelAdmin):
    list_display = ("code", "name", "get_cpf", "get_cnpj", "cell_number", "email", "active")
    list_filter = ("active",)
    readonly_fields = ("code",)
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
