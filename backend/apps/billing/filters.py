from typing import final

import django_filters
from django.db.models import QuerySet
from django.utils import timezone

from .models import BillingDocument


@final
class BillingDocumentFilter(django_filters.FilterSet):
    """Exact filters, `?condominium=<id>` through the unit and `?is_overdue=` (derived from the due date)."""

    condominium = django_filters.UUIDFilter(field_name="unit__condominium")
    is_overdue = django_filters.BooleanFilter(method="filter_is_overdue")

    class Meta:
        model = BillingDocument
        fields = ("status", "unit", "payer", "reference_month", "competence_month")

    def filter_is_overdue(
        self, queryset: QuerySet[BillingDocument], name: str, value: bool
    ) -> QuerySet[BillingDocument]:
        overdue = queryset.overdue_on(timezone.localdate())  # type: ignore[attr-defined]
        return overdue if value else queryset.exclude(pk__in=overdue.values("pk"))
