"""The "ID" of condominiums (spec 019, R1, R2, R4, R5). A unit has no ID: it is the condominium plus its number."""


import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import Condominium
from .base import body

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"
OTHER_CNPJ = "45723174000110"
SENT_CODE = 987654321


def make_condominium(name: str, cnpj: str = CNPJ, **fields: object) -> Condominium:
    return Condominium.objects.create(company=seeded_company(), name=name, cnpj=cnpj, **fields)


def test_new_condominiums_get_consecutive_codes(condominium: Condominium) -> None:
    other = make_condominium("Outro", OTHER_CNPJ)

    assert other.code == condominium.code + 1


def test_code_is_ignored_when_sent_to_the_api(api_client: APIClient) -> None:
    created = api_client.post(
        reverse("condominium-list"),
        {"name": "Novo", "cnpj": OTHER_CNPJ, "code": SENT_CODE},
        format="json",
    )

    assert created.status_code == status.HTTP_201_CREATED
    assert body(created)["code"] != SENT_CODE

    condominium = Condominium.objects.get(pk=body(created)["id"])
    code_before = condominium.code
    patched = api_client.patch(
        reverse("condominium-detail", args=[condominium.pk]), {"code": SENT_CODE}, format="json"
    )

    assert patched.status_code == status.HTTP_200_OK
    condominium.refresh_from_db()
    assert condominium.code == code_before
