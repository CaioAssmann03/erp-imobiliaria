import operator
from collections.abc import Sequence
from functools import reduce
from typing import Any, override

from django.db import models
from rest_framework import filters
from rest_framework.request import Request
from rest_framework.views import APIView

from .codes import code_from_term


class QuerySearchFilter(filters.SearchFilter):
    """Busca textual por `?query=termo` (mantém `?search=` como alternativa legada).

    Os campos pesquisados vêm de `search_fields` de cada view; os termos são separados
    por espaço e todos precisam casar (comportamento padrão do DRF).

    A view que define `search_code_field = "code"` também casa um termo só de dígitos com o ID
    do cadastro, e lista primeiro quem tem exatamente aquele ID (spec 019).
    """

    search_param = "query"
    search_title = "Busca"
    search_description = "Termo de busca (nome, documento, ID…)."

    def get_search_terms(self, request: Request) -> list[str]:
        raw_query = request.query_params.get(self.search_param) or request.query_params.get(
            "search", ""
        )
        return raw_query.replace("\x00", "").replace(",", " ").split()

    def filter_queryset(
        self, request: Request, queryset: models.QuerySet[Any], view: APIView
    ) -> models.QuerySet[Any]:
        code_field: str | None = getattr(view, "search_code_field", None)
        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)
        if code_field is None or not search_fields or not search_terms:
            return super().filter_queryset(request, queryset, view)

        orm_lookups = [self.construct_search(str(field), queryset) for field in search_fields]
        base = queryset
        conditions: list[models.Q] = []
        codes: list[int] = []
        for term in search_terms:
            term_matches = reduce(
                operator.or_, (models.Q(**{lookup: term}) for lookup in orm_lookups)
            )
            code = code_from_term(term)
            if code is not None:
                term_matches |= models.Q(**{code_field: code})
                codes.append(code)
            conditions.append(term_matches)
        queryset = queryset.filter(reduce(operator.and_, conditions))

        if self.must_call_distinct(queryset, search_fields):
            queryset = base.filter(models.Exists(queryset.filter(pk=models.OuterRef("pk"))))
        return self._exact_code_first(queryset, code_field, codes)

    @staticmethod
    def _exact_code_first(
        queryset: models.QuerySet[Any], code_field: str, codes: list[int]
    ) -> models.QuerySet[Any]:
        if not codes:
            return queryset
        ordering = queryset.query.order_by or queryset.model._meta.ordering
        exact_match = models.Case(
            models.When(**{code_field: codes[0]}, then=models.Value(0)),
            default=models.Value(1),
            output_field=models.IntegerField(),
        )
        annotated: models.QuerySet[Any] = queryset.annotate(code_match=exact_match)
        return annotated.order_by("code_match", *ordering)


class TieBreakingOrderingFilter(filters.OrderingFilter):
    """`?ordering=field` (`-field` for descending) over the view's `ordering_fields` (spec 037).

    Whatever is asked, the view's default `ordering` and then the id follow it, so rows that compare
    equal always come back in the same order and consecutive pages never repeat or skip one. An
    unknown field is ignored. List it before `QuerySearchFilter`, which keeps this order after the
    record whose ID matches the search term exactly.
    """

    ordering_description = "Ordering: a field name, with a `-` prefix for descending."

    @override
    def get_ordering(
        self, request: Request, queryset: models.QuerySet[Any], view: APIView
    ) -> Sequence[str] | None:
        ordering = super().get_ordering(request, queryset, view)
        if not ordering:
            return ordering
        ordered_fields = {field.lstrip("-") for field in ordering}
        tie_breakers = [
            field
            for field in (*(self.get_default_ordering(view) or ()), "pk")
            if field.lstrip("-") not in ordered_fields
        ]
        return [*ordering, *tie_breakers]

    @override
    def get_schema_operation_parameters(self, view: APIView) -> list[dict[str, Any]]:
        parameters = super().get_schema_operation_parameters(view)
        allowed_fields: tuple[str, ...] = getattr(view, "ordering_fields", ())
        if allowed_fields:
            parameters[0]["schema"]["enum"] = [
                f"{direction}{field}" for field in allowed_fields for direction in ("", "-")
            ]
        return parameters
