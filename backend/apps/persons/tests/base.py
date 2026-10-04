from typing import cast

from rest_framework.response import Response

from apps.persons.models import Person, people_individual, people_legal


def body(response: Response) -> dict[str, object]:
    """`response.data` vem como Any; o cast fica concentrado aqui."""
    return cast(dict[str, object], response.data)  # pyright: ignore[reportAny]


def make_individual(
    name: str = "Maria", cpf: str = "12345678901", job: str | None = None
) -> Person:
    person = Person.objects.create(name=name)
    _ = people_individual.objects.create(person=person, cpf=cpf, job=job)
    return person


def make_legal(name: str = "Empresa LTDA", cnpj: str = "12345678000199") -> Person:
    person = Person.objects.create(name=name)
    _ = people_legal.objects.create(person=person, cnpj=cnpj)
    return person
