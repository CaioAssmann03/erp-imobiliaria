from typing import Any, cast

from rest_framework.response import Response

JsonObject = dict[str, Any]


def body(response: Response) -> JsonObject:
    return cast(JsonObject, response.data)  # pyright: ignore[reportAny]


def results(response: Response) -> list[JsonObject]:
    return cast(list[JsonObject], body(response)["results"])


def errors(response: Response) -> list[dict[str, str | None]]:
    """The error items of the flat error body `{"errors": [{field, code, message}]}` (spec 006)."""
    return cast(list[dict[str, str | None]], body(response)["errors"])


def error_codes(response: Response, field: str | None) -> list[str | None]:
    """The codes reported for one field (`None`: errors that are not about a field)."""
    return [item["code"] for item in errors(response) if item["field"] == field]
