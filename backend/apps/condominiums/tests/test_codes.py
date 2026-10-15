"""The "ID" of condominiums and units (spec 019, R1, R2, R4, R5)."""

from datetime import date

import pytest
from django.test import Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Company
from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from .base import body, results

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"
OTHER_CNPJ = "45723174000110"
SENT_CODE = 987654321


def make_condominium(name: str, cnpj: str = CNPJ, **fields: object) -> Condominium:
    return Condominium.objects.create(company=seeded_company(), name=name, cnpj=cnpj, **fields)


def test_condominiums_and_units_count_independently(condominium: Condominium) -> None:
    first_unit = Unit.objects.create(condominium=condominium, name="101")
    other = make_condominium("Outro", OTHER_CNPJ)
    second_unit = Unit.objects.create(condominium=condominium, name="102")

    assert other.code == condominium.code + 1
    assert second_unit.code == first_unit.code + 1


def test_a_deleted_codes_number_is_not_reused(condominium: Condominium) -> None:
    removed = Unit.objects.create(condominium=condominium, name="101")
    removed_code = removed.code
    removed.delete()

    assert Unit.objects.create(condominium=condominium, name="102").code > removed_code


def test_full_clean_does_not_draw_a_code(condominium: Condominium) -> None:
    for _ in range(3):
        Unit(condominium=condominium, name="Rascunho").full_clean()
    Condominium(company=condominium.company, name="Rascunho", cnpj=OTHER_CNPJ).full_clean()
    next_condominium = make_condominium("Seguinte", OTHER_CNPJ)

    assert next_condominium.code == condominium.code + 1


def test_code_is_ignored_when_sent_to_the_api(
    api_client: APIClient, condominium: Condominium
) -> None:
    created = api_client.post(
        reverse("condominium-list"),
        {"name": "Novo", "cnpj": OTHER_CNPJ, "code": SENT_CODE},
        format="json",
    )
    unit_created = api_client.post(
        reverse("unit-list"),
        {"condominium": str(condominium.pk), "name": "101", "code": SENT_CODE},
        format="json",
    )

    assert created.status_code == status.HTTP_201_CREATED
    assert unit_created.status_code == status.HTTP_201_CREATED
    assert body(created)["code"] != SENT_CODE
    assert body(unit_created)["code"] != SENT_CODE

    unit = Unit.objects.get(pk=body(unit_created)["id"])
    code_before = unit.code
    patched = api_client.patch(
        reverse("unit-detail", args=[unit.pk]), {"code": SENT_CODE}, format="json"
    )

    assert patched.status_code == status.HTTP_200_OK
    unit.refresh_from_db()
    assert unit.code == code_before


def test_condominium_unit_and_nested_person_carry_the_code(
    api_client: APIClient, condominium: Condominium
) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101", code=4243)
    person = Person.objects.create(company=condominium.company, name="Maria", code=4244)
    _ = UnitPerson.objects.create(
        unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
    )

    condominium_detail = body(api_client.get(reverse("condominium-detail", args=[condominium.pk])))
    unit_detail = body(api_client.get(reverse("unit-detail", args=[unit.pk])))
    unit_row = results(api_client.get(reverse("unit-list")))[0]

    assert condominium_detail["code"] == condominium.code
    assert unit_detail["code"] == unit_row["code"] == 4243
    assert unit_detail["unit_people"][0]["person_detail"]["code"] == 4244


def test_list_search_by_code_for_condominiums(api_client: APIClient) -> None:
    _ = make_condominium("Zeta", CNPJ, code=7001)
    _ = make_condominium("Alfa 7001", OTHER_CNPJ, code=7002)

    response = api_client.get(reverse("condominium-list"), {"query": "7001"})

    assert [row["name"] for row in results(response)] == ["Zeta", "Alfa 7001"]


def test_list_search_by_code_for_units(api_client: APIClient, condominium: Condominium) -> None:
    _ = Unit.objects.create(condominium=condominium, name="Z-unit", code=7001)
    _ = Unit.objects.create(condominium=condominium, name="A-7001", code=7002)

    response = api_client.get(reverse("unit-list"), {"query": "7001"})

    assert [row["name"] for row in results(response)] == ["Z-unit", "A-7001"]


def test_list_search_by_code_does_not_cross_companies(
    other_api_client: APIClient, condominium: Condominium
) -> None:
    _ = Unit.objects.create(condominium=condominium, name="101", code=7001)

    assert results(other_api_client.get(reverse("unit-list"), {"query": "7001"})) == []
    assert results(other_api_client.get(reverse("condominium-list"), {"query": "7001"})) == []


@pytest.mark.parametrize("term", ["abc", "0", "9" * 25])
def test_list_search_with_text_or_long_digits_never_fails(
    api_client: APIClient, condominium: Condominium, term: str
) -> None:
    for route in ("condominium-list", "unit-list"):
        assert api_client.get(reverse(route), {"query": term}).status_code == status.HTTP_200_OK


def test_admin_lists_and_searches_by_the_code_read_only(company: Company) -> None:
    superuser = User.objects.create_superuser("root", password="x", company=company)
    condominium = make_condominium("Sol Admin", CNPJ, code=4242)
    unit = Unit.objects.create(condominium=condominium, name="Unidade Admin", code=4243)
    person = Person.objects.create(company=company, name="Pessoa Admin", code=4244)
    client = Client()
    client.force_login(superuser)

    for route, name, code in (
        ("admin:condominiums_condominium_changelist", "Sol Admin", 4242),
        ("admin:condominiums_unit_changelist", "Unidade Admin", 4243),
        ("admin:persons_person_changelist", "Pessoa Admin", 4244),
    ):
        by_code = client.get(reverse(route), {"q": str(code)})
        by_text = client.get(reverse(route), {"q": "zzz-sem-resultado"})

        assert by_code.status_code == status.HTTP_200_OK
        assert name in by_code.content.decode()
        assert by_text.status_code == status.HTTP_200_OK
        assert name not in by_text.content.decode()

    for route, instance in (
        ("admin:condominiums_condominium_change", condominium),
        ("admin:condominiums_unit_change", unit),
        ("admin:persons_person_change", person),
    ):
        form = client.get(reverse(route, args=[instance.pk]))

        assert form.status_code == status.HTTP_200_OK
        assert 'name="code"' not in form.content.decode()
