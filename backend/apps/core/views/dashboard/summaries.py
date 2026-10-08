from typing import Any

from django.db import models
from django.db.models import Count, Q, TextChoices

from apps.persons.models import Person


def summarize_by_type(
    queryset: "models.QuerySet[Any]", type_field: str, types: type[TextChoices]
) -> dict[str, object]:
    """Total, ativos e contagem por tipo (todos os tipos aparecem, mesmo com 0)."""
    aggregate = queryset.aggregate(
        total=Count("pk"), active=Count("pk", filter=Q(active=True))
    )
    counts = dict(queryset.values_list(type_field).annotate(n=Count("pk")))
    return {
        **aggregate,
        "by_type": [
            {"type": value, "title": title, "total": counts.get(value, 0)}
            for value, title in types.choices
        ],
    }


def summarize_persons(persons: models.QuerySet[Person]) -> dict[str, object]:
    aggregate = persons.aggregate(
        total=Count("pk"),
        active=Count("pk", filter=Q(active=True)),
        individual=Count("pk", filter=Q(people_individual__isnull=False)),
        legal=Count("pk", filter=Q(people_legal__isnull=False)),
    )
    return {
        "total": aggregate["total"],
        "active": aggregate["active"],
        "by_type": [
            {
                "type": "individual",
                "title": "Individual",
                "total": aggregate["individual"],
            },
            {"type": "legal", "title": "Legal", "total": aggregate["legal"]},
        ],
    }
