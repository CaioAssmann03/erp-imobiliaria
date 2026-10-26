from typing import Any

from django.db.models import TextChoices

from apps.core.models.querysets import CountsByTypeQuerySet
from apps.persons.models.querysets import PersonQuerySet


def summarize_by_type(
    queryset: CountsByTypeQuerySet[Any], types: type[TextChoices]
) -> dict[str, object]:
    counts = queryset.count_by_type()
    return {
        **queryset.totals(),
        "by_type": [
            {"type": value, "title": title, "total": counts.get(value, 0)}
            for value, title in types.choices
        ],
    }


def summarize_persons(persons: PersonQuerySet) -> dict[str, object]:
    totals = persons.totals()
    return {
        "total": totals["total"],
        "active": totals["active"],
        "by_type": [
            {"type": "individual", "title": "Individual", "total": totals["individual"]},
            {"type": "legal", "title": "Legal", "total": totals["legal"]},
        ],
    }
