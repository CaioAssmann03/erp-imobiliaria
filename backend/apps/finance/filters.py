import django_filters
from django.db.models import QuerySet
from typing_extensions import final

from .models import AccountPayable, CurrentAccountEntry, EntryTemplate


@final
class EntryTemplateFilter(django_filters.FilterSet):
    """`?condominium=<id>` filters through the cost center (`cost_center` and `active` are exact)."""

    condominium = django_filters.UUIDFilter(field_name="cost_center__condominium")

    class Meta:
        model = EntryTemplate
        fields = ("cost_center", "active")


@final
class AccountPayableFilter(django_filters.FilterSet):
    """Exact filters, a due-date range and `?is_company_expense=true` (no condominium)."""

    due_date_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")
    due_date_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    is_company_expense = django_filters.BooleanFilter(method="filter_is_company_expense")

    class Meta:
        model = AccountPayable
        fields = ("status", "supplier", "condominium", "cost_center")

    def filter_is_company_expense(
        self, queryset: QuerySet[AccountPayable], name: str, value: bool
    ) -> QuerySet[AccountPayable]:
        return queryset.filter(condominium__isnull=value)


@final
class CurrentAccountEntryFilter(django_filters.FilterSet):
    """The statement: `?condominium=<id>`, an entry-date range and a competence month (`?competence_month=2026-10-01`)."""

    condominium = django_filters.UUIDFilter(field_name="current_account__condominium")
    entry_date_after = django_filters.DateFilter(field_name="entry_date", lookup_expr="gte")
    entry_date_before = django_filters.DateFilter(field_name="entry_date", lookup_expr="lte")

    class Meta:
        model = CurrentAccountEntry
        fields = ("current_account", "batch", "cost_center", "entry_template", "unit", "kind", "origin", "competence_month")
