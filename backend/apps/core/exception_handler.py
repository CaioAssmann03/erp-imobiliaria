"""One error shape for the whole API (spec 006): `{"errors": [{"field", "code", "message"}]}`.

DRF builds the response (status codes and exception classes are unchanged); this handler only rebuilds
its body from the `ErrorDetail` objects, which carry each message with its code. An exception DRF does
not handle (a real 500) is left to Django, so no internal detail leaves the server.
"""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.serializers.model_rules import to_drf_errors

ErrorItem = dict[str, str | None]


def _is_leaf(detail: Any) -> bool:
    return isinstance(detail, ErrorDetail)


def _item(path: list[str], detail: ErrorDetail) -> ErrorItem:
    return {
        "field": ".".join(path) if path else None,
        "code": str(detail.code),
        "message": str(detail),
    }


def flatten_errors(detail: Any, path: list[str] | None = None) -> list[ErrorItem]:
    """Walk DRF's error tree (dicts for fields, lists for messages and for many=True items)."""
    path = path or []
    if _is_leaf(detail):
        return [_item(path, detail)]
    if isinstance(detail, dict):
        items: list[ErrorItem] = []
        for key, value in detail.items():
            is_general = key in (api_settings.NON_FIELD_ERRORS_KEY, "detail") and not path
            items.extend(flatten_errors(value, path if is_general else [*path, str(key)]))
        return items
    if isinstance(detail, list):
        has_nested = any(isinstance(entry, (dict, list)) for entry in detail)
        items = []
        for position, entry in enumerate(detail):
            entry_path = [*path, str(position)] if has_nested else path
            items.extend(flatten_errors(entry, entry_path))
        return items
    return []


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DjangoValidationError):
        # A model rule raised outside a serializer (a delete rule, code calling the model): same 400.
        exc = serializers.ValidationError(to_drf_errors(exc))
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    detail = response.data
    # SimpleJWT adds extra keys next to `detail`; only the message and its code are the error.
    if isinstance(detail, dict) and _is_leaf(detail.get("detail")):
        detail = {"detail": detail["detail"]}
    response.data = {"errors": flatten_errors(detail)}
    return response
