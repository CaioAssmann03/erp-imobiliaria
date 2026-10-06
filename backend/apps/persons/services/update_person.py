from typing import Any

from django.db import transaction

from apps.persons.models import PeopleIndividual, PeopleLegal, Person


@transaction.atomic
def update_person(person: Person, person_data: dict[str, Any]) -> Person:
    """Update a person and create or update its nested documents."""
    person_fields = dict(person_data)
    individual_data = person_fields.pop("people_individual", None)
    legal_data = person_fields.pop("people_legal", None)

    for field_name, field_value in person_fields.items():
        setattr(person, field_name, field_value)
    person.save()

    if individual_data:
        _ = PeopleIndividual.objects.update_or_create(
            person=person, defaults={**individual_data, "company": person.company}
        )
    if legal_data:
        _ = PeopleLegal.objects.update_or_create(
            person=person, defaults={**legal_data, "company": person.company}
        )

    return person
