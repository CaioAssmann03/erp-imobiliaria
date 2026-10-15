from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final

from apps.core.serializers import SearchSerializer
from apps.persons.models import PersonModule

from .condominiums import search_condominiums
from .persons import search_persons
from .term import classify_term
from .units import search_units


def requested_module(request: Request) -> str | None:
    """`?module=` as a valid module, or a 400 `invalid_choice` on the `module` field."""
    raw_module = request.query_params.get("module")
    if raw_module is None:
        return None
    try:
        return str(serializers.ChoiceField(choices=PersonModule.choices).run_validation(raw_module))
    except serializers.ValidationError as error:
        raise serializers.ValidationError({"module": error.detail}) from error


@final
class SearchView(APIView):
    """Busca global: poucos resultados de cada cadastro, em uma única requisição.

    Cada consulta é limitada a `LIMIT_PER_TYPE` linhas. O cadastro cujo ID foi digitado vem primeiro,
    depois quem começa com o termo.
    """

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
            OpenApiParameter(
                "module",
                str,
                enum=PersonModule.values,
                required=False,
                description="Lista só as pessoas que pertencem a este módulo.",
            ),
        ],
        responses=SearchSerializer,
        operation_id="search_retrieve",
    )
    def get(self, request: Request) -> Response:
        module = requested_module(request)
        query = classify_term(request.query_params.get("q", "").strip())
        if not query.is_searchable:
            return Response(
                SearchSerializer({"persons": [], "condominiums": [], "units": []}).data
            )

        results: dict[str, Any] = {
            "persons": search_persons(request.user, query, module),
            "condominiums": search_condominiums(request.user, query),
            "units": search_units(request.user, query),
        }
        return Response(SearchSerializer(results).data)
