"""Company scoping: one place decides which records a user may see (spec 004).

Every model declares `company_lookup`, the path from the model to its company. A superuser
bypasses the scope; everybody else is limited to `user.company`. The viewset mixin, the
serializer relation field and the admin mixin only call `scope_to_company`.
"""

from typing import Any, TypeVar

from django.contrib.admin import ModelAdmin
from django.db import models
from django.db.models import Model, QuerySet
from django.http import HttpRequest
from rest_framework import serializers
from rest_framework.request import Request

ModelT = TypeVar("ModelT", bound=Model)


def company_lookup_of(model: type[Model]) -> str:
    """Path from `model` to its company; a model without one must fail loudly."""
    lookup = getattr(model, "company_lookup", None)
    if not isinstance(lookup, str):
        raise NotImplementedError(
            f"{model.__name__} must declare `company_lookup` (spec 004: company scoping)."
        )
    return lookup


def scope_to_company(queryset: QuerySet[ModelT], user: Any) -> QuerySet[ModelT]:
    """Limit `queryset` to the user's company; a superuser sees every company."""
    if user is None or not getattr(user, "is_authenticated", False):
        return queryset.none()
    if user.is_superuser:
        return queryset
    lookup = company_lookup_of(queryset.model)
    return queryset.filter(**{lookup: user.company_id})


def request_company(serializer: serializers.BaseSerializer[Any]) -> Any:
    """The company that owns what the current request creates: the user's own (spec 004)."""
    return serializer.context["request"].user.company


def request_company_or_none(serializer: serializers.BaseSerializer[Any]) -> Any:
    """Like `request_company`, for validation that may run without a request."""
    request = serializer.context.get("request")
    user = getattr(request, "user", None)
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return user.company


class CompanyScopedViewSetMixin:
    """DRF viewset mixin: `get_queryset` is always limited to the user's company.

    Put it before the DRF base class in the bases.
    """

    def get_queryset(self) -> QuerySet[Any]:
        queryset: QuerySet[Any] = super().get_queryset()  # type: ignore[misc]
        return scope_to_company(queryset, self.request.user)  # type: ignore[attr-defined]


class CompanyScopedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):  # type: ignore[type-arg]
    """Relation field whose choices are limited to the user's company.

    An id of another company answers "does not exist", the same as a missing id.
    """

    def get_queryset(self) -> QuerySet[Any] | None:
        queryset: QuerySet[Any] | None = super().get_queryset()
        request = self.context.get("request")
        if queryset is None or request is None:
            return queryset
        return scope_to_company(queryset, request.user)


class CompanyScopedAdminMixin:
    """Django Admin mixin: lists and foreign-key choices follow the user's company.

    A non-superuser sees a single company in a company field, already selected.
    """

    def get_queryset(self, request: HttpRequest) -> QuerySet[Any]:
        queryset: QuerySet[Any] = super().get_queryset(request)  # type: ignore[misc]
        return scope_to_company(queryset, request.user)

    def formfield_for_foreignkey(
        self, db_field: models.ForeignKey[Any], request: HttpRequest, **kwargs: Any
    ) -> Any:
        related_model = db_field.remote_field.model
        user: Any = request.user
        if "queryset" not in kwargs and hasattr(related_model, "company_lookup"):
            kwargs["queryset"] = scope_to_company(related_model._default_manager.all(), user)
            if related_model._meta.label == "core.Company" and not user.is_superuser:
                kwargs.setdefault("initial", user.company_id)
        parent: ModelAdmin[Any] = super()  # type: ignore[assignment]
        return parent.formfield_for_foreignkey(db_field, request, **kwargs)
