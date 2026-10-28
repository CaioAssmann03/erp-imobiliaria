from typing import Any, cast

from apps.condominiums.models import Condominium
from apps.condominiums.models.querysets import CondominiumQuerySet
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm


def search_condominiums(user: Any, query: ClassifiedTerm) -> list[Condominium]:
    condominiums = cast(CondominiumQuerySet, scope_to_company(Condominium.objects.all(), user))
    return list(condominiums.search(query)[:LIMIT_PER_TYPE])
