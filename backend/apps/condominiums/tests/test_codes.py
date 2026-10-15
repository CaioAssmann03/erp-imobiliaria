"""The "ID" of condominiums (spec 019, R1, R2, R4, R5). A unit has no ID: it is the condominium plus its number."""

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


def test_new_condominiums_get_consecutive_codes(condominium: Condominium) -> None:
    other = make_condominium("Outro", OTHER_CNPJ)

    assert other.code == condominium.code + 1


def test_a_deleted_codes_number_is_not_reused(condominium: Condominium) -> None:
    removed = make_condominium("Removido", OTHER_CNPJ)
    removed_code = removed.code
    removed.delete()

    assert make_condominium("Seguinte", OTHER_CNPJ).code > removed_code


def test_full_clean_does_not_draw_a_code(condominium: Condominium) -> None:
    for _ in range(3):
        Condominium(company=condominium.company, name="Rascunho", cnpj=OTHER_CNPJ).full_clean()
    next_condominium = make_condominium("Seguinte", OTHER_CNPJ)

    assert next_condominium.code == condominium.code + 1


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


def test_condominium_and_the_person_of_a_unit_link_carry_the_code(
    api_client: APIClient, condominium: Condominium
) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")
    person = Person.objects.create(company=condominium.company, name="Maria", code=4244)
    _ = UnitPerson.objects.create(
        unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
    )

    condominium_detail = body(api_client.get(reverse("condominium-detail", args=[condominium.pk])))
    unit_detail = body(api_client.get(reverse("unit-detail", args=[unit.pk])))

    assert condominium_detail["code"] == condominium.code
    assert unit_detail["unit_people"][0]["person_detail"]["code"] == 4244


def test_a_unit_has_no_id(api_client: APIClient, condominium: Condominium) -> None:
    unit = Unit.objects.create(condominium=condominium, name="101")

    detail = body(api_client.get(reverse("unit-detail", args=[unit.pk])))
    listed = results(api_client.get(reverse("unit-list")))[0]

    assert "code" not in detail
    assert "code" not in listed
    assert not hasattr(unit, "code")


def test_list_search_by_code_for_condominiums(api_client: APIClient) -> None:
    _ = make_condominium("Zeta", CNPJ, code=7001)
    _ = make_condominium("Alfa 7001", OTHER_CNPJ, code=7002)

    response = api_client.get(reverse("condominium-list"), {"query": "7001"})

    assert [row["name"] for row in results(response)] == ["Zeta", "Alfa 7001"]


def test_units_are_still_searched_by_their_number(
    api_client: APIClient, condominium: Condominium
) -> None:
    _ = Unit.objects.create(condominium=condominium, name="101")
    _ = Unit.objects.create(condominium=condominium, name="202")

    response = api_client.get(reverse("unit-list"), {"query": "101"})

    assert [row["name"] for row in results(response)] == ["101"]


def test_list_search_by_code_does_not_cross_companies(
    other_api_client: APIClient,
) -> None:
    _ = make_condominium("Zeta", CNPJ, code=7001)

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
    person = Person.objects.create(company=company, name="Pessoa Admin", code=4244)
    client = Client()
    client.force_login(superuser)

    for route, name, code in (
        ("admin:condominiums_condominium_changelist", "Sol Admin", 4242),
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
        ("admin:persons_person_change", person),
    ):
        form = client.get(reverse(route, args=[instance.pk]))

        assert form.status_code == status.HTTP_200_OK
        assert 'name="code"' not in form.content.decode()
