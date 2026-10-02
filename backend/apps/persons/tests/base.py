from typing import cast

from django.urls import reverse
from rest_framework.response import Response
from rest_framework.test import APITestCase

from apps.persons.models import PeopleIndividual, PeopleLegal, Person


def body(response: Response) -> dict[str, object]:
    """`response.data` vem como Any; o cast fica concentrado aqui."""
    return cast(dict[str, object], response.data)  # pyright: ignore[reportAny]


def make_individual(
    name: str = "Maria", cpf: str = "12345678901", job: str | None = None
) -> Person:
    person = Person.objects.create(name=name)
    _ = PeopleIndividual.objects.create(person=person, cpf=cpf, job=job)
    return person


def make_legal(name: str = "Empresa LTDA", cnpj: str = "12345678000199") -> Person:
    person = Person.objects.create(name=name)
    _ = PeopleLegal.objects.create(person=person, cnpj=cnpj)
    return person


class PersonAPITestCase(APITestCase):
    @property
    def list_url(self) -> str:
        return reverse("person-list")

    def detail_url(self, person: Person) -> str:
        return reverse("person-detail", args=[person.pk])
