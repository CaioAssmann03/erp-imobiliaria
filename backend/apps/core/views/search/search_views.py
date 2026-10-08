from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final

from apps.core.serializers import SearchSerializer

from .condominiums import search_condominiums
from .persons import search_persons
from .term import MIN_TEXT_LENGTH, classify_term
from .units import search_units


@final
class SearchView(APIView):
    """Busca global: poucos resultados de cada cadastro, em uma única requisição.

    Cada consulta é limitada a `LIMIT_PER_TYPE` linhas. Quem começa com o termo vem primeiro.
    """

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "q",
                str,
                required=True,
                description="Termo: mín. 3 caracteres (2 se for numérico). CPF/CNPJ com ou sem pontuação.",
            )
        ],
        responses=SearchSerializer,
        operation_id="search_retrieve",
    )
    def get(self, request: Request) -> Response:
        term = request.query_params.get("q", "").strip()
        classified = classify_term(term)
        if not classified.is_searchable:
            return Response(
                SearchSerializer({"persons": [], "condominiums": [], "units": []}).data
            )

        # Termo numérico: documentos são guardados só com dígitos, então a pontuação digitada
        # é descartada antes de comparar. Abaixo de 3 dígitos só o nome é pesquisado.
        digits = classified.digits
        should_search_document = len(digits) >= MIN_TEXT_LENGTH

        results: dict[str, Any] = {
            "persons": search_persons(request.user, term, digits, should_search_document),
            "condominiums": search_condominiums(
                request.user, term, digits, should_search_document
            ),
            "units": search_units(request.user, term),
        }
        return Response(SearchSerializer(results).data)
