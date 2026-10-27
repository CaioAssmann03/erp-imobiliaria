from typing import Any, cast

from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm
from apps.finance.models import AccountPayable
from apps.finance.models.querysets import AccountPayableQuerySet


def search_accounts_payable(user: Any, query: ClassifiedTerm) -> list[AccountPayable]:
    accounts = cast(AccountPayableQuerySet, scope_to_company(AccountPayable.objects.all(), user))
    return list(accounts.search(query)[:LIMIT_PER_TYPE])
