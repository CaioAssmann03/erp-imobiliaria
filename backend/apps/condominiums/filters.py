from typing import final

import django_filters
from django.db.models import QuerySet, TextChoices
from django.utils import timezone

from .models import Condominium, CondominiumAdministrationContract, Unit


class CondominiumPending(TextChoices):
    """The condominium pendencies of the dashboard (`?pending=`), each with its own list."""

    WITHOUT_COST_CENTERS = ("without_cost_centers", "Without cost centers")
    INCONSISTENT_APPORTIONMENT = (
        "inconsistent_apportionment",
        "Apportionment not 100%",
    )
    OVERDUE_ADJUSTMENT = ("overdue_adjustment", "Overdue adjustment")
    UPCOMING_ADJUSTMENT = ("upcoming_adjustment", "Adjustment in 30 days")


class UnitPending(TextChoices):
    """The unit pendencies of the dashboard (`?pending=`)."""

    WITHOUT_RESPONSIBLE = ("without_responsible", "Without responsible")
    LEASE_ENDING = ("lease_ending", "Lease ending")
    BILLING_BLOCKED = ("billing_blocked", "Billing blocked")


@final
class CondominiumFilter(django_filters.FilterSet):
    """Exact filters plus `?pending=` (the dashboard's pendencies, same definitions)."""

    pending = django_filters.ChoiceFilter(
        choices=CondominiumPending.choices, method="filter_pending"
    )

    class Meta:
        model = Condominium
        fields = ("company", "advisor", "active", "type", "address__state")

    def filter_pending(
        self, queryset: QuerySet[Condominium], name: str, value: str
    ) -> QuerySet[Condominium]:
        today = timezone.localdate()
        contracts = CondominiumAdministrationContract.objects
        match value:
            case CondominiumPending.WITHOUT_COST_CENTERS:
                return queryset.without_cost_centers()  # type: ignore[attr-defined, no-any-return]
            case CondominiumPending.INCONSISTENT_APPORTIONMENT:
                return queryset.with_inconsistent_apportionment()  # type: ignore[attr-defined, no-any-return]
            case CondominiumPending.OVERDUE_ADJUSTMENT:
                return queryset.filter(
                    pk__in=contracts.overdue_adjustment_condominium_ids(today)
                )
            case _:
                return queryset.filter(
                    pk__in=contracts.upcoming_adjustment_condominium_ids(today)
                )


@final
class UnitFilter(django_filters.FilterSet):
    """Exact filters plus `?pending=` (the dashboard's pendencies, same definitions)."""

    pending = django_filters.ChoiceFilter(
        choices=UnitPending.choices, method="filter_pending"
    )

    class Meta:
        model = Unit
        fields = ("condominium", "block", "active", "type", "is_billing_blocked")

    def filter_pending(
        self, queryset: QuerySet[Unit], name: str, value: str
    ) -> QuerySet[Unit]:
        today = timezone.localdate()
        match value:
            case UnitPending.WITHOUT_RESPONSIBLE:
                return queryset.without_responsible(today)  # type: ignore[attr-defined, no-any-return]
            case UnitPending.LEASE_ENDING:
                return queryset.filter(active=True).with_lease_ending_soon(today)  # type: ignore[attr-defined, no-any-return]
            case _:
                return queryset.billing_blocked()  # type: ignore[attr-defined, no-any-return]
