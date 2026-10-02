from django.contrib import admin
from typing_extensions import final
from unfold.admin import ModelAdmin, StackedInline

from .models import Person, people_individual, people_legal


@final
class PeopleIndividualInline(StackedInline):
    model = people_individual
    extra = 0


@final
class PeopleLegalInline(StackedInline):
    model = people_legal
    extra = 0


@final
@admin.register(Person)
class PersonAdmin(ModelAdmin):
    list_display = ("name", "get_cpf", "get_cnpj", "cell_number", "email", "active")
    list_filter = ("active",)
    search_fields = ("name", "email", "people_individual__cpf", "people_legal__cnpj")
    list_select_related = ("people_individual", "people_legal")
    inlines = (PeopleIndividualInline, PeopleLegalInline)

    @admin.display(description="CPF")
    def get_cpf(self, obj: Person) -> str:
        individual = getattr(obj, "people_individual", None)
        return individual.cpf if individual else "-"

    @admin.display(description="CNPJ")
    def get_cnpj(self, obj: Person) -> str:
        legal = getattr(obj, "people_legal", None)
        return legal.cnpj if legal else "-"
