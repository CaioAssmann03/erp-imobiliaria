from typing import Any, cast

from apps.condominiums.models import Unit
from apps.condominiums.models.querysets import UnitQuerySet
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm


def search_units(user: Any, query: ClassifiedTerm) -> list[Unit]:
    units = cast(UnitQuerySet, scope_to_company(Unit.objects.all(), user))
    return list(units.search(query)[:LIMIT_PER_TYPE])
