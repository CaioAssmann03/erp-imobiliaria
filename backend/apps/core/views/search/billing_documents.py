from typing import Any, cast

from apps.billing.models import BillingDocument
from apps.billing.models.querysets import BillingDocumentQuerySet
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm


def search_billing_documents(user: Any, query: ClassifiedTerm) -> list[BillingDocument]:
    documents = cast(BillingDocumentQuerySet, scope_to_company(BillingDocument.objects.all(), user))
    return list(documents.search(query)[:LIMIT_PER_TYPE])
