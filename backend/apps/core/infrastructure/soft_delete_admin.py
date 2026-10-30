from collections.abc import Callable
from typing import Any, ClassVar, NamedTuple, override

from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from django.http import HttpRequest


class ArchivedAction(NamedTuple):
    """An extra button of the Arquivados page for a deleted record (for example the anonymization of a person)."""

    name: str
    label: str
    run: Callable[[Any], Any]
    superuser_only: bool = True


class ArchivedListFilter(admin.SimpleListFilter):
    """Deleted (archived) records are hidden by default; this filter shows them."""

    title = "situação do registro"
    parameter_name = "deleted"

    @override
    def lookups(self, request: HttpRequest, model_admin: Any) -> list[tuple[str, str]]:
        return [("no", "Ativos"), ("yes", "Excluídos"), ("all", "Todos")]

    @override
    def choices(self, changelist: Any) -> Any:
        selected = self.value() or "no"
        for value, label in self.lookup_choices:
            yield {
                "selected": selected == value,
                "query_string": changelist.get_query_string({self.parameter_name: value}),
                "display": label,
            }

    @override
    def queryset(self, request: HttpRequest, queryset: QuerySet[Any]) -> QuerySet[Any]:
        value = self.value() or "no"
        if value == "yes":
            return queryset.filter(deleted_at__isnull=False)
        if value == "no":
            return queryset.filter(deleted_at__isnull=True)
        return queryset


class SoftDeleteAdminMixin:
    """Django Admin mixin for an archivable model: lists live and deleted records (filter `deleted`), restores them and
    turns a refused deletion (an archive rule) into a message instead of an error page.

    Put it after `CompanyScopedAdminMixin` and before `ModelAdmin` in the bases, and add `ArchivedListFilter` to `list_filter`.
    """

    actions = ("restore_selected",)
    # How the model is called on the Arquivados page, and the extra buttons it has there.
    archived_label: ClassVar[str] = ""
    archived_actions: ClassVar[tuple[ArchivedAction, ...]] = ()

    @override
    def get_queryset(self, request: HttpRequest) -> QuerySet[Any]:
        queryset: QuerySet[Any] = self.model.all_objects.get_queryset()  # type: ignore[attr-defined]
        ordering = self.get_ordering(request)  # type: ignore[attr-defined]
        return queryset.order_by(*ordering) if ordering else queryset

    def delete_model(self, request: HttpRequest, obj: Any) -> None:
        self._archive(request, obj)

    def delete_queryset(self, request: HttpRequest, queryset: QuerySet[Any]) -> None:
        for obj in queryset:
            self._archive(request, obj)

    @admin.action(description="Restore the selected deleted records")
    def restore_selected(self, request: HttpRequest, queryset: QuerySet[Any]) -> None:
        for obj in queryset.filter(deleted_at__isnull=False):
            try:
                obj.restore()
            except ValidationError as error:
                self.message_user(request, f"{obj}: {'; '.join(error.messages)}", level=messages.ERROR)  # type: ignore[attr-defined]

    def _archive(self, request: HttpRequest, obj: Any) -> None:
        try:
            obj.delete()
        except ValidationError as error:
            self.message_user(request, f"{obj}: {'; '.join(error.messages)}", level=messages.ERROR)  # type: ignore[attr-defined]
