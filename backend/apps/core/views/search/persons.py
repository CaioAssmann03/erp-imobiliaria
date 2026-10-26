from typing import Any, cast

from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm
from apps.persons.models import Person
from apps.persons.models.querysets import PersonQuerySet


def search_persons(user: Any, query: ClassifiedTerm) -> list[Person]:
    people = cast(PersonQuerySet, scope_to_company(Person.objects.all(), user))
    return list(people.search(query)[:LIMIT_PER_TYPE])
