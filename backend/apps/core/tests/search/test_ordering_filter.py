"""The ordering filter ends every order with the view's default order and the id (spec 037, R2).

Rows that compare equal (every active condominium has the same status) must come back in a fixed
order, or two consecutive pages could repeat a row and skip another.
"""

from collections.abc import Sequence
from types import SimpleNamespace
from typing import cast

import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from apps.condominiums.models import Condominium
from apps.core.api.filters import TieBreakingOrderingFilter

VIEW = cast(APIView, SimpleNamespace(ordering_fields=("code", "name", "active"), ordering=("name",)))


def ordering_asked(asked: str) -> Sequence[str] | None:
    request = Request(APIRequestFactory().get("/", {"ordering": asked}))
    return TieBreakingOrderingFilter().get_ordering(request, Condominium.objects.all(), VIEW)


@pytest.mark.parametrize(
    ("asked", "expected"),
    [
        ("", ["name", "pk"]),
        ("name", ["name", "pk"]),
        ("-name", ["-name", "pk"]),
        ("code", ["code", "name", "pk"]),
        ("-active", ["-active", "name", "pk"]),
        ("-active,code", ["-active", "code", "name", "pk"]),
        ("nope", ["name", "pk"]),
    ],
)
def test_every_ordering_ends_with_the_default_order_and_the_id(
    asked: str, expected: list[str]
) -> None:
    assert ordering_asked(asked) == expected


def test_the_schema_lists_the_allowed_values() -> None:
    (parameter,) = TieBreakingOrderingFilter().get_schema_operation_parameters(VIEW)

    assert parameter["name"] == "ordering"
    assert parameter["schema"]["enum"] == ["code", "-code", "name", "-name", "active", "-active"]
