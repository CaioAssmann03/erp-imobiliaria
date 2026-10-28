from decimal import Decimal
from typing import Any, cast

from rest_framework.response import Response

from ..models import Condominium, CondominiumApportionmentCriterion, Unit, UnitApportionmentFraction

JsonObject = dict[str, Any]


def body(response: Response) -> JsonObject:
    """`response.data` vem como Any; o cast fica concentrado aqui."""
    return cast(JsonObject, response.data)  # pyright: ignore[reportAny]


def results(response: Response) -> list[JsonObject]:
    return cast(list[JsonObject], body(response)["results"])


def errors(response: Response) -> list[dict[str, str | None]]:
    """The error items of the flat error body `{"errors": [{field, code, message}]}` (spec 006)."""
    return cast(list[dict[str, str | None]], body(response)["errors"])


def error_codes(response: Response, field: str | None) -> list[str | None]:
    """The codes reported for one field (`None`: errors that are not about a field)."""
    return [item["code"] for item in errors(response) if item["field"] == field]


def criterion_at(condominium: Condominium, position: int = 1) -> CondominiumApportionmentCriterion:
    """The condominium's criterion at `position` (the main one is created with the condominium)."""
    name = CondominiumApportionmentCriterion.MAIN_NAME if position == 1 else f"Fração {position}"
    criterion, _ = CondominiumApportionmentCriterion.objects.get_or_create(
        condominium=condominium, position=position, defaults={"name": name}
    )
    return criterion


def add_fraction(unit: Unit, value: str | int | Decimal, position: int = 1) -> UnitApportionmentFraction:
    """Give `unit` a fraction of `value` in the criterion at `position`."""
    return UnitApportionmentFraction.objects.create(
        unit=unit,
        criterion=criterion_at(unit.condominium, position),
        value=Decimal(str(value)),
    )
