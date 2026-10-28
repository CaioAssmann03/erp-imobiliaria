from typing import Any, cast

from apps.condominiums.models import Block
from apps.condominiums.models.querysets import BlockQuerySet
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm


def search_blocks(user: Any, query: ClassifiedTerm) -> list[Block]:
    blocks = cast(BlockQuerySet, scope_to_company(Block.objects.all(), user))
    return list(blocks.search(query)[:LIMIT_PER_TYPE])
