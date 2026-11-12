"""Pagination that reads the page's ids first and joins only for those rows.

A list that orders by columns of other tables and also `select_related`s several of them makes
PostgreSQL join, hash and sort every row of the company before it can cut the page. Finding the
page needs only the filters and the ordering; the joins are needed for the 20 rows shown.
"""

from typing import Any

from django.db.models import QuerySet


class DeferredJoinPaginationMixin:
    """DRF viewset mixin: paginate the ids, then load the page's rows with their joins.

    Put it before the DRF base class in the bases. The result is the same as paginating the full
    queryset (same filters, same ordering, same count); only the cost changes.
    """

    def paginate_queryset(self, queryset: QuerySet[Any]) -> list[Any] | None:
        page_ids = super().paginate_queryset(  # type: ignore[misc]
            queryset.prefetch_related(None).values_list("pk", flat=True)
        )
        if page_ids is None:
            return None
        rows_by_id = {row.pk: row for row in self.get_queryset().filter(pk__in=page_ids)}  # type: ignore[attr-defined]
        return [rows_by_id[pk] for pk in page_ids if pk in rows_by_id]
