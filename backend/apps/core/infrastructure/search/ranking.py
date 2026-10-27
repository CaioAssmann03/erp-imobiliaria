import operator
from functools import reduce

from django.db.models import Case, IntegerField, Q, Value, When

from .term import ClassifiedTerm

LIMIT_PER_TYPE = 5


def any_of(conditions: list[Q]) -> Q:
    return reduce(operator.or_, conditions)


def exact_code(query: ClassifiedTerm) -> Q | None:
    """The record whose ID was typed, when the term is only digits."""
    return None if query.code is None else Q(code=query.code)


def relevance_rank(starts_with: list[Q], exact: Q | None) -> Case:
    """0 para o ID digitado, 1 para quem começa com o termo (ou casa pelo início do documento), 2 para o resto."""
    whens: list[When] = []
    if exact is not None:
        whens.append(When(exact, then=Value(0)))
    if starts_with:
        whens.append(When(any_of(starts_with), then=Value(1)))
    return Case(*whens, default=Value(2), output_field=IntegerField())
