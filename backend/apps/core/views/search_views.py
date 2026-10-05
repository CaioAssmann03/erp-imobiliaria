import re
from typing import Any, NamedTuple

from django.db.models import Case, IntegerField, Q, Value, When
from django.db.models.functions import Coalesce
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final

from apps.condominiums.models import Condominium, Unit
from apps.core.scoping import scope_to_company
from apps.persons.models import Person

from ..serializers import SearchSerializer

MIN_TEXT_LENGTH = 3  # o índice trigram só é eficiente a partir de 3 caracteres
MIN_NUMERIC_LENGTH = 2  # números curtos (ex.: unidade "12") são válidos
LIMIT_PER_TYPE = 5

# Termo "de documento/número": só dígitos e a pontuação de CPF/CNPJ.
NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")


class ClassifiedTerm(NamedTuple):
    is_searchable: bool
    digits: str  # só quando o termo é numérico; vazio caso contrário


def _classify_term(term: str) -> ClassifiedTerm:
    if NUMERIC_TERM.match(term):
        digits = re.sub(r"\D", "", term)
        return ClassifiedTerm(len(digits) >= MIN_NUMERIC_LENGTH, digits)
    return ClassifiedTerm(len(term) >= MIN_TEXT_LENGTH, "")


def _relevance_rank(*conditions: Q) -> Case:
    """0 para quem começa com o termo (ou casa pelo início do documento), 1 para o resto."""
    criteria = conditions[0]
    for condition in conditions[1:]:
        criteria |= condition
    return Case(
        When(criteria, then=Value(0)), default=Value(1), output_field=IntegerField()
    )


def _search_persons(
    user: Any, term: str, digits: str, should_search_document: bool
) -> list[Person]:
    name_filter = Q(name__icontains=term)
    ranking = [Q(name__istartswith=term)]
    if should_search_document:
        name_filter |= Q(people_individual__cpf__contains=digits) | Q(
            people_legal__cnpj__contains=digits
        )
        ranking += [
            Q(people_individual__cpf__startswith=digits),
            Q(people_legal__cnpj__startswith=digits),
        ]
    return list(
        scope_to_company(Person.objects.all(), user)
        .filter(name_filter)
        .annotate(
            rank=_relevance_rank(*ranking),
            document=Coalesce("people_individual__cpf", "people_legal__cnpj", Value("")),
        )
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )


def _search_condominiums(
    user: Any, term: str, digits: str, should_search_document: bool
) -> list[Condominium]:
    name_filter = Q(name__icontains=term)
    ranking = [Q(name__istartswith=term)]
    if should_search_document:
        name_filter |= Q(cnpj__contains=digits)
        ranking.append(Q(cnpj__startswith=digits))
    return list(
        scope_to_company(Condominium.objects.all(), user)
        .filter(name_filter)
        .annotate(rank=_relevance_rank(*ranking))
        .select_related("address")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )


def _search_units(user: Any, term: str) -> list[Unit]:
    return list(
        scope_to_company(Unit.objects.all(), user)
        .filter(name__icontains=term)
        .annotate(rank=_relevance_rank(Q(name__istartswith=term)))
        .select_related("condominium")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )


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
        classified = _classify_term(term)
        if not classified.is_searchable:
            return Response(
                SearchSerializer({"persons": [], "condominiums": [], "units": []}).data
            )

        # Termo numérico: documentos são guardados só com dígitos, então a pontuação digitada
        # é descartada antes de comparar. Abaixo de 3 dígitos só o nome é pesquisado.
        digits = classified.digits
        should_search_document = len(digits) >= MIN_TEXT_LENGTH

        results: dict[str, Any] = {
            "persons": _search_persons(request.user, term, digits, should_search_document),
            "condominiums": _search_condominiums(
                request.user, term, digits, should_search_document
            ),
            "units": _search_units(request.user, term),
        }
        return Response(SearchSerializer(results).data)
