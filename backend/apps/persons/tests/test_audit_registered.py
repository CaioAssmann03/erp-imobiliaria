"""Personal data in the audit trail (spec 005, R4, R5)."""

import pytest
from auditlog.models import LogEntry
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.audit import MASKED_VALUE
from apps.core.testing import seeded_company

from ..models import PeopleIndividual, PeopleLegal, Person
from .base import CNPJ_A, CPF_A, make_individual, make_legal

pytestmark = pytest.mark.django_db


def all_changes_text() -> str:
    return " ".join(str(entry.changes) for entry in LogEntry.objects.all())


def test_personal_fields_are_masked_in_entries() -> None:
    person = Person.objects.create(
        company=seeded_company(), name="Maria", email="maria@exemplo.com.br", cell_number="(11) 91234-5678"
    )
    person.email = "nova@exemplo.com.br"
    person.save()

    update_entry = LogEntry.objects.get_for_object(person).latest("timestamp")

    assert update_entry.changes["email"] == [MASKED_VALUE, MASKED_VALUE]


def test_real_cpf_never_appears_in_any_entry() -> None:
    person = make_individual(cpf=CPF_A)
    PeopleIndividual.objects.filter(pk=person.pk).first().save()  # type: ignore[union-attr]
    individual = PeopleIndividual.objects.get(pk=person.pk)
    individual.cpf = "11144477735"
    individual.rg = "123456789"
    individual.job = "Engenheira"
    individual.save()

    text = all_changes_text()

    assert CPF_A not in text
    assert "11144477735" not in text
    assert "123456789" not in text
    assert "Engenheira" not in text
    assert "cpf" in str(LogEntry.objects.get_for_object(individual).latest("timestamp").changes)


def test_real_cnpj_never_appears_in_any_entry() -> None:
    person = make_legal(cnpj=CNPJ_A)
    legal = PeopleLegal.objects.get(pk=person.pk)
    legal.ie = "123456789"
    legal.save()

    assert CNPJ_A not in all_changes_text()
    assert "123456789" not in all_changes_text()


def test_nested_person_write_logs_each_record(api_client: APIClient) -> None:
    response = api_client.post(
        "/api/persons/",
        {"name": "Maria", "email": "maria@exemplo.com.br", "people_individual": {"cpf": CPF_A}},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    models_logged = {
        entry.content_type.model for entry in LogEntry.objects.filter(action=LogEntry.Action.CREATE)
    }
    assert {"person", "peopleindividual"} <= models_logged
    assert CPF_A not in all_changes_text()
