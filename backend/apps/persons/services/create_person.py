from typing import Any

from django.db import transaction

from apps.core.models import Company
from apps.persons.models import PeopleIndividual, PeopleLegal, Person


@transaction.atomic
def create_person(company: Company, person_data: dict[str, Any]) -> Person:
    """Create a person with its optional nested `people_individual` and `people_legal` documents."""
    person_fields = dict(person_data)
    individual_data = person_fields.pop("people_individual", None)
    legal_data = person_fields.pop("people_legal", None)

    person = Person.objects.create(company=company, **person_fields)

    if individual_data:
        _ = PeopleIndividual.objects.create(person=person, company=company, **individual_data)
    if legal_data:
        _ = PeopleLegal.objects.create(person=person, company=company, **legal_data)

    return person
