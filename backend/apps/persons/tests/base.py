from typing import Any, cast

from rest_framework.response import Response

from apps.core.models import Company
from apps.core.testing import seeded_company

from ..models import PeopleIndividual, PeopleLegal, Person

CPF_A = "52998224725"
CPF_B = "11144477735"
CNPJ_A = "11222333000181"
CNPJ_B = "45723174000110"


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


def make_individual(
    name: str = "Maria",
    cpf: str = CPF_A,
    job: str | None = None,
    company: Company | None = None,
) -> Person:
    owner = company or seeded_company()
    person = Person.objects.create(company=owner, name=name)
    _ = PeopleIndividual.objects.create(person=person, company=owner, cpf=cpf, job=job)
    return person


def make_legal(
    name: str = "Empresa LTDA", cnpj: str = CNPJ_A, company: Company | None = None
) -> Person:
    owner = company or seeded_company()
    person = Person.objects.create(company=owner, name=name)
    _ = PeopleLegal.objects.create(person=person, company=owner, cnpj=cnpj)
    return person
