from typing import TYPE_CHECKING


from apps.core.models import SoftDeleteQuerySet
from apps.core.infrastructure.search.ranking import relevance_rank
from apps.core.infrastructure.search.text_match import name_matches

if TYPE_CHECKING:
    from apps.core.infrastructure.search.term import ClassifiedTerm

    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.cost_center import CostCenter  # noqa: F401


class CostCenterQuerySet(SoftDeleteQuerySet["CostCenter"]):
    def search(self, query: "ClassifiedTerm") -> "CostCenterQuerySet":
        """Cost centers whose name matches the global search term, the best match first.

        A cost center has no ID, so a term that only asks for an ID (a single digit) finds none.
        """
        conditions = name_matches(query, "name")
        if conditions is None:
            return self.none()
        contains, starts_with = conditions
        return (
            self.filter(contains)
            .annotate(rank=relevance_rank([starts_with], None))
            .select_related("condominium")
            .order_by("rank", "condominium__code", "code")
        )
