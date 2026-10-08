from django.db.models import Case, IntegerField, Q, Value, When

LIMIT_PER_TYPE = 5


def relevance_rank(*conditions: Q) -> Case:
    """0 para quem começa com o termo (ou casa pelo início do documento), 1 para o resto."""
    criteria = conditions[0]
    for condition in conditions[1:]:
        criteria |= condition
    return Case(
        When(criteria, then=Value(0)), default=Value(1), output_field=IntegerField()
    )
