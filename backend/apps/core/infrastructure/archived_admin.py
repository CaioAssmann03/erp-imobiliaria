from typing import Any

from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from apps.core.infrastructure.soft_delete_admin import SoftDeleteAdminMixin

PAGE_SIZE = 100


def _archivable_admins(request: HttpRequest) -> dict[str, Any]:
    """The Admin of every archivable model the user may change, by `app_label.model_name`."""
    found: dict[str, Any] = {}
    for model, model_admin in admin.site._registry.items():
        if isinstance(model_admin, SoftDeleteAdminMixin) and model_admin.has_change_permission(request):
            found[f"{model._meta.app_label}.{model._meta.model_name}"] = model_admin
    return found


def _label(model_admin: Any) -> str:
    return model_admin.archived_label or str(model_admin.model._meta.verbose_name_plural)


def _archived(request: HttpRequest, model_admin: Any) -> Any:
    """The deleted records of the user's company (the Admin queryset already follows the company)."""
    return model_admin.get_queryset(request).filter(deleted_at__isnull=False).order_by("-deleted_at")


def _act(request: HttpRequest, admins: dict[str, Any]) -> None:
    model_admin = admins.get(request.POST.get("model", ""))
    if model_admin is None:
        messages.error(request, "Tipo de registro desconhecido.")
        return
    record = _archived(request, model_admin).filter(pk=request.POST.get("pk", "")).first()
    if record is None:
        messages.error(request, "Registro não encontrado entre os arquivados.")
        return
    action = request.POST.get("action", "")
    try:
        if action == "restore":
            record.restore()
            messages.success(request, f"{record} foi restaurado.")
            return
        extra = next((item for item in model_admin.archived_actions if item.name == action), None)
        if extra is None or (extra.superuser_only and not request.user.is_superuser):
            messages.error(request, "Ação não permitida.")
            return
        extra.run(record)
        messages.success(request, f"{record}: {extra.label.lower()} concluída.")
    except ValidationError as error:
        messages.error(request, f"{record}: {'; '.join(error.messages)}")


@require_http_methods(["GET", "POST"])
def archived_records_view(request: HttpRequest) -> HttpResponse:
    """The Arquivados page of the Admin (spec 063): the deleted records of every archivable model, with restore (spec 062)."""
    admins = _archivable_admins(request)
    if request.method == "POST":
        _act(request, admins)
        return HttpResponseRedirect(request.get_full_path())

    query = request.GET.get("q", "").strip()
    selected = request.GET.get("type", "")
    if selected not in admins:
        selected = next(iter(admins), "")

    tabs = [
        {"key": key, "label": _label(model_admin), "count": _archived(request, model_admin).count(), "selected": key == selected}
        for key, model_admin in admins.items()
    ]
    rows: list[dict[str, Any]] = []
    total = 0
    if selected:
        model_admin = admins[selected]
        queryset = _archived(request, model_admin)
        if query and model_admin.search_fields:
            queryset, _distinct = model_admin.get_search_results(request, queryset, query)
        total = queryset.count()
        for record in queryset[:PAGE_SIZE]:
            rows.append(
                {
                    "pk": record.pk,
                    "label": str(record),
                    "deleted_at": record.deleted_at,
                    "actions": [item for item in model_admin.archived_actions if request.user.is_superuser or not item.superuser_only],
                }
            )
    context = {
        **admin.site.each_context(request),
        "title": "Arquivados",
        "tabs": tabs,
        "selected": selected,
        "query": query,
        "rows": rows,
        "total": total,
        "page_size": PAGE_SIZE,
        "page_url": reverse("admin_archived"),
    }
    return render(request, "admin/archived_records.html", context)
