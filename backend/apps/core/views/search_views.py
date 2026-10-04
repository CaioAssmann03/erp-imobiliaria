import re

from django.db.models import Case, IntegerField, Q, Value, When
from django.db.models.functions import Coalesce
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from typing_extensions import final, override

from apps.condominiums.models import Condominium, Unit
from apps.persons.models import Person

from ..serializers import SearchSerializer

MIN_TEXT_LENGTH = 3  # o índice trigram só é eficiente a partir de 3 caracteres
MIN_NUMERIC_LENGTH = 2  # números curtos (ex.: unidade "12") são válidos
LIMIT_PER_TYPE = 5

# Termo "de documento/número": só dígitos e a pontuação de CPF/CNPJ.
NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")


def _classify(term: str) -> tuple[bool, str]:
    """Retorna (termo_valido, digitos). `digitos` só quando o termo é numérico."""
    if NUMERIC_TERM.match(term):
        digits = re.sub(r"\D", "", term)
        return len(digits) >= MIN_NUMERIC_LENGTH, digits
    return len(term) >= MIN_TEXT_LENGTH, ""


def _relevance(*conditions: Q) -> Case:
    """0 para quem começa com o termo (ou casa pelo início do documento), 1 para o resto."""
    criteria = conditions[0]
    for condition in conditions[1:]:
        criteria |= condition
    return Case(
        When(criteria, then=Value(0)), default=Value(1), output_field=IntegerField()
    )


@final
class SearchView(APIView):
    """Busca global: poucos resultados de cada cadastro, em uma única requisição.

    Cada consulta é limitada a `LIMIT_PER_TYPE` linhas. Quem começa com o termo vem primeiro.
    """

    @override
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
        valid, digits = _classify(term)
        if not valid:
            return Response(
                SearchSerializer(
                    {"persons": [], "condominiums": [], "units": []}
                ).data
            )

        # Termo numérico: documentos são guardados só com dígitos, então a pontuação digitada
        # é descartada antes de comparar.
        search_document = len(digits) >= MIN_TEXT_LENGTH

        person_filter = Q(name__icontains=term)
        person_rank = [Q(name__istartswith=term)]
        condominium_filter = Q(name__icontains=term)
        condominium_rank = [Q(name__istartswith=term)]
        if search_document:
            person_filter |= Q(people_individual__cpf__contains=digits) | Q(
                people_legal__cnpj__contains=digits
            )
            person_rank += [
                Q(people_individual__cpf__startswith=digits),
                Q(people_legal__cnpj__startswith=digits),
            ]
            condominium_filter |= Q(cnpj__contains=digits)
            condominium_rank.append(Q(cnpj__startswith=digits))

        data = {
            "persons": Person.objects.filter(person_filter)
            .annotate(
                rank=_relevance(*person_rank),
                document=Coalesce(
                    "people_individual__cpf", "people_legal__cnpj", Value("")
                ),
            )
            .order_by("rank", "name")[:LIMIT_PER_TYPE],
            "condominiums": Condominium.objects.filter(condominium_filter)
            .annotate(rank=_relevance(*condominium_rank))
            .select_related("address")
            .order_by("rank", "name")[:LIMIT_PER_TYPE],
            "units": Unit.objects.filter(name__icontains=term)
            .annotate(rank=_relevance(Q(name__istartswith=term)))
            .select_related("condominium")
            .order_by("rank", "name")[:LIMIT_PER_TYPE],
        }
        return Response(SearchSerializer(data).data)
