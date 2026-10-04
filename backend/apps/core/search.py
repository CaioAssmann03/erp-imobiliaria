import re

from django.db.models import Case, IntegerField, Q, Value, When
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.condominiums.models import Condominio, Unidade
from apps.core.sql import so_digitos
from apps.persons.models import Pessoa

MIN_TEXT_LENGTH = 3  # o índice trigram só é eficiente a partir de 3 caracteres
MIN_NUMERIC_LENGTH = 2  # números curtos (ex.: unidade "12") são válidos
LIMIT_PER_TYPE = 5

# Termo "de documento/número": só dígitos e a pontuação de CPF/CNPJ.
NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")


def _classificar(termo: str):
    """Retorna (termo_valido, digitos). `digitos` só quando o termo é numérico."""
    if NUMERIC_TERM.match(termo):
        digitos = re.sub(r"\D", "", termo)
        return len(digitos) >= MIN_NUMERIC_LENGTH, digitos
    return len(termo) >= MIN_TEXT_LENGTH, ""


def _relevancia(*condicoes: Q):
    """0 para quem começa com o termo (ou casa pelo início do documento), 1 para o resto."""
    criterio = condicoes[0]
    for condicao in condicoes[1:]:
        criterio |= condicao
    return Case(
        When(criterio, then=Value(0)), default=Value(1), output_field=IntegerField()
    )


class PessoaBuscaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    cpf_cnpj = serializers.CharField()


class CondominioBuscaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    cnpj = serializers.CharField(allow_null=True)
    cidade = serializers.CharField(allow_null=True)
    uf = serializers.CharField(allow_null=True)


class UnidadeBuscaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome_unidade = serializers.CharField()
    condominio = serializers.IntegerField(source="condominio_id")
    condominio_nome = serializers.CharField(source="condominio.nome")


class BuscaSerializer(serializers.Serializer):
    pessoas = PessoaBuscaSerializer(many=True)
    condominios = CondominioBuscaSerializer(many=True)
    unidades = UnidadeBuscaSerializer(many=True)


class BuscaView(APIView):
    """Busca global: poucos resultados de cada cadastro, em uma única requisição.

    Cada consulta usa os índices trigram (`UPPER(coluna) LIKE` e dígitos do documento) e é
    limitada a `LIMIT_PER_TYPE` linhas. Quem começa com o termo vem primeiro.
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
        responses=BuscaSerializer,
        operation_id="busca_retrieve",
    )
    def get(self, request):
        termo = request.query_params.get("q", "").strip()
        valido, digitos = _classificar(termo)
        if not valido:
            return Response(
                BuscaSerializer({"pessoas": [], "condominios": [], "unidades": []}).data
            )

        # Termo numérico: compara os dígitos do documento (aceita com ou sem pontuação).
        # O índice dos dígitos é trigram, então só vale a partir de 3 dígitos.
        busca_doc = len(digitos) >= MIN_TEXT_LENGTH

        pessoas = Pessoa.objects.annotate(doc_digitos=so_digitos("cpf_cnpj"))
        filtro_pessoa = Q(nome__icontains=termo)
        rank_pessoa = [Q(nome__istartswith=termo)]
        if busca_doc:
            filtro_pessoa |= Q(doc_digitos__contains=digitos)
            rank_pessoa.append(Q(doc_digitos__startswith=digitos))
        elif not digitos:
            filtro_pessoa |= Q(cpf_cnpj__icontains=termo)

        condominios = Condominio.objects.annotate(cnpj_digitos=so_digitos("cnpj"))
        filtro_condominio = Q(nome__icontains=termo)
        rank_condominio = [Q(nome__istartswith=termo)]
        if busca_doc:
            filtro_condominio |= Q(cnpj_digitos__contains=digitos)
            rank_condominio.append(Q(cnpj_digitos__startswith=digitos))
        elif not digitos:
            filtro_condominio |= Q(cnpj__icontains=termo)

        data = {
            "pessoas": pessoas.filter(filtro_pessoa)
            .annotate(rank=_relevancia(*rank_pessoa))
            .order_by("rank", "nome")
            .only("id", "nome", "cpf_cnpj")[:LIMIT_PER_TYPE],
            "condominios": condominios.filter(filtro_condominio)
            .annotate(rank=_relevancia(*rank_condominio))
            .order_by("rank", "nome")
            .only("id", "nome", "cnpj", "cidade", "uf")[:LIMIT_PER_TYPE],
            "unidades": Unidade.objects.filter(nome_unidade__icontains=termo)
            .annotate(rank=_relevancia(Q(nome_unidade__istartswith=termo)))
            .order_by("rank", "nome_unidade")
            .select_related("condominio")
            .only("id", "nome_unidade", "condominio__id", "condominio__nome")[
                :LIMIT_PER_TYPE
            ],
        }
        return Response(BuscaSerializer(data).data)
