from collections.abc import Callable
from typing import Any, final

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.infrastructure.search.term import ClassifiedTerm, classify_term
from apps.core.serializers import SearchSerializer

from .accounts_payable import search_accounts_payable
from .billing_documents import search_billing_documents
from .billing_plans import search_billing_plans
from .blocks import search_blocks
from .condominiums import search_condominiums
from .cost_centers import search_cost_centers
from .persons import search_persons
from .units import search_units

SEARCHES_BY_GROUP: dict[str, Callable[[Any, ClassifiedTerm], list[Any]]] = {
    "persons": search_persons,
    "condominiums": search_condominiums,
    "units": search_units,
    "blocks": search_blocks,
    "cost_centers": search_cost_centers,
    "accounts_payable": search_accounts_payable,
    "billing_plans": search_billing_plans,
    "billing_documents": search_billing_documents,
}


@final
class SearchView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter(
                "q",
                str,
                required=True,
                description=(
                    "Termo: mín. 3 caracteres (2 se for numérico). CPF/CNPJ com ou sem pontuação. "
                    "Só dígitos (1 a 18) também buscam o ID do cadastro; 1 dígito busca só o ID."
                ),
            ),
        ],
        responses=SearchSerializer,
        operation_id="search_retrieve",
    )
    def get(self, request: Request) -> Response:
        query = classify_term(request.query_params.get("q", "").strip())
        if not query.is_searchable:
            nothing_found: dict[str, object] = {group: [] for group in SEARCHES_BY_GROUP}
            return Response(SearchSerializer(nothing_found).data)

        results: dict[str, object] = {
            group: search(request.user, query) for group, search in SEARCHES_BY_GROUP.items()
        }
        return Response(SearchSerializer(results).data)
