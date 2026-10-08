"""Demo persons (individuals and legal entities)."""

import random
from typing import Any

from django.db.models import Q

from apps.core.models import Company
from apps.persons.models import PeopleIndividual, PeopleLegal, Person

from .demo_data import COMPANIES, NAMES
from .documents import generate_cnpj, generate_cpf
from .fakes import email_slug, random_past_datetime, random_phone
from .validated import create_validated


def demo_person_definitions() -> list[tuple[str, str, str]]:
    """(name, kind, document) determinísticos."""
    definitions = [
        (name, "individual", generate_cpf(position + 1))
        for position, name in enumerate(NAMES)
    ]
    definitions += [
        (name, "legal", generate_cnpj(position + 1))
        for position, name in enumerate(COMPANIES)
    ]
    return definitions


def random_person_fields(
    random_generator: random.Random, position: int, name: str
) -> dict[str, Any]:
    has_missing_contact = (
        position % 7 == 3
    )  # some people have no email/cell (pending item)
    return {
        "name": name,
        "cell_number": None if has_missing_contact else random_phone(random_generator),
        "email": "" if has_missing_contact else f"{email_slug(name)}@exemplo.com.br",
        "active": position % 11 != 10,
    }


def create_person(
    company: Company,
    random_generator: random.Random,
    position: int,
    definition: tuple[str, str, str],
) -> Person:
    name, kind, document = definition
    person = create_validated(
        Person,
        company=company,
        **random_person_fields(random_generator, position, name),
    )
    if kind == "individual":
        _ = create_validated(
            PeopleIndividual,
            person=person,
            company=company,
            cpf=document,
            marital_status=random_generator.choice(
                ["Solteiro(a)", "Casado(a)", "Divorciado(a)"]
            ),
            job=random_generator.choice(
                [
                    "Engenheiro(a)",
                    "Médico(a)",
                    "Advogado(a)",
                    "Professor(a)",
                    "Empresário(a)",
                ]
            ),
        )
    else:
        _ = create_validated(PeopleLegal, person=person, company=company, cnpj=document)
    _ = Person.objects.filter(pk=person.pk).update(
        created_at=random_past_datetime(random_generator, 170)
    )
    return person


def create_persons(company: Company, random_generator: random.Random) -> list[Person]:
    persons: list[Person] = []
    for position, definition in enumerate(demo_person_definitions()):
        document = definition[2]
        existing_person = Person.objects.filter(
            Q(people_individual__cpf=document) | Q(people_legal__cnpj=document)
        ).first()
        persons.append(
            existing_person
            or create_person(company, random_generator, position, definition)
        )
    return persons
