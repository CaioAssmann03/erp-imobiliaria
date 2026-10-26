from typing import Any

from django.db import transaction

from apps.core.models import Company
from apps.persons.models import PeopleIndividual, PeopleLegal, Person
from apps.persons.services.release_person_to_module import release_person_to_module


@transaction.atomic
def create_person(company: Company, person_data: dict[str, Any]) -> Person:
    """Create a person with its optional nested `people_individual` and `people_legal` documents.

    `person_data["module"]`, when present, releases the new person to that module in the same transaction.
    """
    person_fields = dict(person_data)
    module = person_fields.pop("module", None)
    individual_data = person_fields.pop("people_individual", None)
    legal_data = person_fields.pop("people_legal", None)

    person = Person.objects.create(company=company, **person_fields)

    if individual_data:
        _ = PeopleIndividual.objects.create(person=person, company=company, **individual_data)
    if legal_data:
        _ = PeopleLegal.objects.create(person=person, company=company, **legal_data)

    if module is not None:
        release_person_to_module(person, module)

    return person
