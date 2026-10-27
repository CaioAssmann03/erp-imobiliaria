from django.db.models import Q

from .term import ClassifiedTerm


def name_matches(query: ClassifiedTerm, *fields: str) -> tuple[Q, Q] | None:
    """The condition (any field contains the text) and the "starts with" condition for the ranking.

    `None` when the term cannot match text: a single digit is only an ID lookup, which these records do not have.
    """
    if not query.matches_text:
        return None
    contains = Q()
    starts_with = Q()
    for field in fields:
        contains |= Q(**{f"{field}__icontains": query.text})
        starts_with |= Q(**{f"{field}__istartswith": query.text})
    return contains, starts_with
