"""`blocks`: the list searched by `?query=` on the server (spec 064, R3)."""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from ..models import Block, Condominium
from .base import results

pytestmark = pytest.mark.django_db


def test_query_searches_the_block_name(api_client: APIClient, condominium: Condominium) -> None:
    for name in ("Bloco A", "Bloco B", "Torre Norte"):
        _ = Block.objects.create(condominium=condominium, name=name)

    def found(term: str) -> list[str]:
        listed = results(api_client.get(reverse("block-list"), {"condominium": str(condominium.pk), "query": term}))
        return sorted(row["name"] for row in listed)

    assert found("bloco") == ["Bloco A", "Bloco B"]
    assert found("norte") == ["Torre Norte"]
    assert found("zzz") == []
