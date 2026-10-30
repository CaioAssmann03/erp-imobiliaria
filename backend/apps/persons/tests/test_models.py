import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.testing import seeded_company
from ..models import PeopleIndividual, PeopleLegal, Person
from .base import CNPJ_A, CPF_A, CPF_B, make_individual, make_legal

pytestmark = pytest.mark.django_db


def test_str_returns_name() -> None:
    assert str(make_individual(name="Maria")) == "Maria"


def test_str_of_documents() -> None:
    assert str(make_individual().people_individual) == CPF_A
    assert str(make_legal().people_legal) == CNPJ_A


def test_delete_person_cascades_to_individual() -> None:
    person = make_individual()

    _ = person.delete()

    assert not PeopleIndividual.objects.exists()


def test_delete_person_cascades_to_legal() -> None:
    person = make_legal()

    _ = person.delete()

    assert not PeopleLegal.objects.exists()


def test_cpf_is_unique() -> None:
    _ = make_individual(cpf=CPF_A)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_individual(name="Outra", cpf=CPF_A)


def test_cnpj_is_unique() -> None:
    _ = make_legal(cnpj=CNPJ_A)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_legal(name="Outra", cnpj=CNPJ_A)


def test_person_is_ordered_by_code() -> None:
    _ = Person.objects.create(company=seeded_company(), name="Zeca")
    _ = Person.objects.create(company=seeded_company(), name="Ana")

    # Created first, so the lower code, even though the name comes later in the alphabet.
    assert [person.name for person in Person.objects.all()] == ["Zeca", "Ana"]


@pytest.mark.parametrize("cpf", ["123", "11111111111", "52998224720", "abcdefghijk"])
def test_invalid_cpf_fails_full_clean(cpf: str) -> None:
    person = Person.objects.create(company=seeded_company(), name="Maria")
    individual = PeopleIndividual(person=person, company=person.company, cpf=cpf)

    with pytest.raises(ValidationError) as exc:
        individual.full_clean()

    assert "cpf" in exc.value.message_dict


def test_valid_cpf_passes_full_clean() -> None:
    person = Person.objects.create(company=seeded_company(), name="Maria")

    PeopleIndividual(person=person, company=person.company, cpf=CPF_B).full_clean()


@pytest.mark.parametrize("cnpj", ["123", "00000000000000", "11222333000180"])
def test_invalid_cnpj_fails_full_clean(cnpj: str) -> None:
    person = Person.objects.create(company=seeded_company(), name="Empresa")
    legal = PeopleLegal(person=person, company=person.company, cnpj=cnpj)

    with pytest.raises(ValidationError) as exc:
        legal.full_clean()

    assert "cnpj" in exc.value.message_dict
