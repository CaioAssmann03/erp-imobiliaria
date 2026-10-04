from typing import Any, cast

from rest_framework.response import Response

JsonObject = dict[str, Any]


def body(response: Response) -> JsonObject:
    """`response.data` vem como Any; o cast fica concentrado aqui."""
    return cast(JsonObject, response.data)  # pyright: ignore[reportAny]


def results(response: Response) -> list[JsonObject]:
    """Itens da página de uma listagem paginada."""
    return cast(list[JsonObject], body(response)["results"])
