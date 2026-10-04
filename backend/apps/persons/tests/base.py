from typing import Any, cast

from rest_framework.response import Response

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
    """Itens da página de uma listagem paginada."""
    return cast(list[JsonObject], body(response)["results"])


def make_individual(
    name: str = "Maria", cpf: str = CPF_A, job: str | None = None
) -> Person:
    person = Person.objects.create(name=name)
    _ = PeopleIndividual.objects.create(person=person, cpf=cpf, job=job)
    return person


def make_legal(name: str = "Empresa LTDA", cnpj: str = CNPJ_A) -> Person:
    person = Person.objects.create(name=name)
    _ = PeopleLegal.objects.create(person=person, cnpj=cnpj)
    return person
