"""The person's "ID" (spec 019, R1, R2, R4, R5): a database number, read-only and searchable."""

from collections.abc import Callable

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import Person
from .base import body, results

pytestmark = pytest.mark.django_db


def make_person(name: str = "Maria", **fields: object) -> Person:
    return Person.objects.create(company=seeded_company(), name=name, **fields)


def names(api_client: APIClient, list_url: str, query: str) -> list[str]:
    return [person["name"] for person in results(api_client.get(list_url, {"query": query}))]


def test_new_people_get_consecutive_codes() -> None:
    codes = [make_person(name).code for name in ("Ana", "Bia", "Carla")]

    assert codes == [codes[0], codes[0] + 1, codes[0] + 2]


def test_a_deleted_codes_number_is_not_reused() -> None:
    _ = make_person("Ana")
    removed = make_person("Bia")
    removed_code = removed.code
    removed.delete()

    assert make_person("Carla").code > removed_code


def test_full_clean_does_not_draw_a_code() -> None:
    first = make_person("Ana")
    for _ in range(3):
        Person(company=seeded_company(), name="Rascunho").full_clean()

    assert make_person("Bia").code == first.code + 1


def test_code_is_ignored_when_sent_to_the_api(
    api_client: APIClient, list_url: str, detail_url: Callable[[Person], str]
) -> None:
    created = api_client.post(list_url, {"name": "Maria", "code": 987654321}, format="json")

    assert created.status_code == status.HTTP_201_CREATED
    person = Person.objects.get(pk=body(created)["id"])
    assert person.code != 987654321

    code_before = person.code
    patched = api_client.patch(detail_url(person), {"code": 987654321}, format="json")

    assert patched.status_code == status.HTTP_200_OK
    person.refresh_from_db()
    assert person.code == code_before


def test_person_responses_carry_the_code(
    api_client: APIClient, list_url: str, detail_url: Callable[[Person], str]
) -> None:
    person = make_person("Maria", code=4242)

    in_list = results(api_client.get(list_url))[0]
    in_detail = body(api_client.get(detail_url(person)))

    assert in_list["code"] == in_detail["code"] == 4242


def test_list_search_puts_the_code_match_first(api_client: APIClient, list_url: str) -> None:
    _ = make_person("Zeca", code=4242)
    _ = make_person("Ana 4242", code=4243)

    # By name "Ana 4242" would come first; the record whose ID was typed comes before it.
    assert names(api_client, list_url, "4242") == ["Zeca", "Ana 4242"]


def test_list_search_by_code_still_needs_every_term_to_match(
    api_client: APIClient, list_url: str
) -> None:
    _ = make_person("Zeca", code=4242)
    _ = make_person("Ana 4242", code=4243)

    assert names(api_client, list_url, "4242 zeca") == ["Zeca"]
    assert names(api_client, list_url, "4242 ana") == ["Ana 4242"]


@pytest.mark.parametrize("term", ["abc", "0", "12345678901234567890", "9" * 40])
def test_list_search_with_text_or_long_digits_never_fails(
    api_client: APIClient, list_url: str, term: str
) -> None:
    _ = make_person("Maria")

    assert api_client.get(list_url, {"query": term}).status_code == status.HTTP_200_OK


def test_list_search_by_code_does_not_cross_companies(
    other_api_client: APIClient, list_url: str
) -> None:
    _ = make_person("Zeca", code=4242)

    assert names(other_api_client, list_url, "4242") == []
