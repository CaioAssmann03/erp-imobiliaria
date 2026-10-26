from typing import TYPE_CHECKING

from django.db.models import Q

from apps.core.infrastructure.search.ranking import any_of, exact_code, relevance_rank
from apps.core.models.querysets import CountsByTypeQuerySet

if TYPE_CHECKING:
    from apps.condominiums.models.condominium import Condominium  # noqa: F401
    from apps.core.infrastructure.search.term import ClassifiedTerm


class CondominiumQuerySet(CountsByTypeQuerySet["Condominium"]):
    def without_cost_centers(self) -> "CondominiumQuerySet":
        """Active condominiums with no cost center (sub-conta): they block the finance."""
        return self.filter(active=True, cost_centers__isnull=True)

    def with_inconsistent_apportionment(self) -> "CondominiumQuerySet":
        """Condominiums whose active units' ideal fractions do not close at 1 (see `UnitQuerySet`)."""
        from apps.condominiums.models.unit import Unit

        return self.filter(
            pk__in=Unit.objects.inconsistent_apportionment_condominium_ids()
        )

    def search(self, query: "ClassifiedTerm") -> "CondominiumQuerySet":
        """Condominiums matching the global search term (name, CNPJ or ID), the best match first."""
        matching: list[Q] = []
        starts_with: list[Q] = []
        if query.matches_text:
            matching.append(Q(name__icontains=query.text))
            starts_with.append(Q(name__istartswith=query.text))
        if query.matches_document:
            matching.append(Q(cnpj__contains=query.digits))
            starts_with.append(Q(cnpj__startswith=query.digits))
        exact = exact_code(query)
        if exact is not None:
            matching.append(exact)
        return (
            self.filter(any_of(matching))
            .annotate(rank=relevance_rank(starts_with, exact))
            .select_related("address")
            .order_by("rank", "name")
        )
