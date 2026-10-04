import calendar
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.condominiums.models import Condominio, Unidade, UnidadeParte
from apps.persons.models import Pessoa

MESES_REAJUSTE = 6  # meses futuros exibidos no gráfico de reajustes
LOCACAO_ANTES = 30  # dias: locações já encerradas ainda exibidas (renovação pendente)
LOCACAO_DEPOIS = 60  # dias: locações que terminam em breve
RATEIO_TOTAL = Decimal("100")
RATEIO_TOLERANCIA = Decimal("0.01")
TOP_LISTAS = 6


# ----- serializers (documentam o schema para o cliente gerado) -----


class TotalPorTipoSerializer(serializers.Serializer):
    tipo = serializers.CharField()
    rotulo = serializers.CharField()
    total = serializers.IntegerField()


class ResumoSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    ativos = serializers.IntegerField()
    por_tipo = TotalPorTipoSerializer(many=True)


class ResponsaveisSerializer(serializers.Serializer):
    unidades_ativas = serializers.IntegerField()
    com_responsavel = serializers.IntegerField(
        help_text="Unidades ativas com proprietário/locatário"
    )


class ReajustePorMesSerializer(serializers.Serializer):
    mes = serializers.CharField(help_text='"atrasados" ou AAAA-MM')
    total = serializers.IntegerField()


class ProximoReajusteSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    data = serializers.DateField()
    indice = serializers.CharField(allow_blank=True)
    atrasado = serializers.BooleanField()


class ReceitaCondominioSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)


class ReceitaFixaSerializer(serializers.Serializer):
    total_mensal = serializers.DecimalField(max_digits=12, decimal_places=2)
    condominios_fixos = serializers.IntegerField()
    condominios_variaveis = serializers.IntegerField(
        help_text="Taxa em %: dependem do financeiro"
    )
    maiores = ReceitaCondominioSerializer(many=True)


class LocacaoSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID da unidade")
    condominio = serializers.IntegerField()
    condominio_nome = serializers.CharField()
    unidade = serializers.CharField()
    locatario = serializers.CharField()
    data_fim = serializers.DateField()
    encerrada = serializers.BooleanField()


class PendenciasSerializer(serializers.Serializer):
    unidades_sem_responsavel = serializers.IntegerField(
        help_text="Unidades ativas sem proprietário/locatário: não há a quem cobrar"
    )
    rateio_inconsistente = serializers.IntegerField(
        help_text="Condomínios ativos cuja soma das frações ideais não fecha 100%"
    )
    reajustes_atrasados = serializers.IntegerField()
    reajustes_30_dias = serializers.IntegerField()
    locacoes_terminando = serializers.IntegerField()
    sem_plano_contas = serializers.IntegerField(
        help_text="Condomínios ativos sem sub-contas"
    )
    lancamentos_bloqueados = serializers.IntegerField()


class DashboardSerializer(serializers.Serializer):
    condominios = ResumoSerializer()
    unidades = ResumoSerializer()
    pessoas = ResumoSerializer()
    responsaveis = ResponsaveisSerializer()
    reajustes_por_mes = ReajustePorMesSerializer(many=True)
    proximos_reajustes = ProximoReajusteSerializer(many=True)
    receita_fixa = ReceitaFixaSerializer()
    locacoes = LocacaoSerializer(many=True)
    pendencias = PendenciasSerializer()


# ----- cálculos -----


def _resumo(model, campo_tipo, tipos):
    """Total, ativos e contagem por tipo (todos os tipos aparecem, mesmo com 0)."""
    agregado = model.objects.aggregate(
        total=Count("id"), ativos=Count("id", filter=Q(ativo=True))
    )
    contagem = dict(model.objects.values_list(campo_tipo).annotate(n=Count("id")))
    return {
        **agregado,
        "por_tipo": [
            {"tipo": valor, "rotulo": rotulo, "total": contagem.get(valor, 0)}
            for valor, rotulo in tipos.choices
        ],
    }


def _somar_meses(origem: date, meses: int) -> date:
    indice = origem.month - 1 + meses
    ano, mes = origem.year + indice // 12, indice % 12 + 1
    return date(ano, mes, min(origem.day, calendar.monthrange(ano, mes)[1]))


def _reajustes(hoje: date):
    """Próximo reajuste de cada condomínio ativo: base + periodicidade (ordenado por data)."""
    itens = []
    condominios = Condominio.objects.filter(
        ativo=True, base_reajuste__isnull=False
    ).only(
        "id", "nome", "base_reajuste", "periodicidade_reajuste_meses", "indice_reajuste"
    )
    for condominio in condominios:
        data = _somar_meses(
            condominio.base_reajuste, condominio.periodicidade_reajuste_meses
        )
        itens.append(
            {
                "id": condominio.id,
                "nome": condominio.nome,
                "data": data,
                "indice": condominio.indice_reajuste,
                "atrasado": data < hoje,
            }
        )
    return sorted(itens, key=lambda item: item["data"])


def _reajustes_por_mes(reajustes, hoje: date):
    meses = [_somar_meses(hoje.replace(day=1), i) for i in range(MESES_REAJUSTE)]
    contagem = {mes.strftime("%Y-%m"): 0 for mes in meses}
    atrasados = 0
    for item in reajustes:
        if item["atrasado"]:
            atrasados += 1
        elif item["data"].strftime("%Y-%m") in contagem:
            contagem[item["data"].strftime("%Y-%m")] += 1
    return [{"mes": "atrasados", "total": atrasados}] + [
        {"mes": mes, "total": total} for mes, total in contagem.items()
    ]


def _receita_fixa():
    fixos = Condominio.objects.filter(ativo=True, tipo_taxa_administracao="fixa")
    total = fixos.aggregate(soma=Sum("valor_taxa_administracao"))["soma"] or Decimal(
        "0"
    )
    maiores = fixos.filter(valor_taxa_administracao__gt=0).order_by(
        "-valor_taxa_administracao"
    )[:8]
    return {
        "total_mensal": total,
        "condominios_fixos": fixos.count(),
        "condominios_variaveis": Condominio.objects.filter(
            ativo=True, tipo_taxa_administracao="variavel"
        ).count(),
        "maiores": [
            {"id": c.id, "nome": c.nome, "valor": c.valor_taxa_administracao}
            for c in maiores
        ],
    }


def _locacoes_queryset(hoje: date):
    return (
        UnidadeParte.objects.filter(
            papel=UnidadeParte.Papel.LOCATARIO,
            unidade__ativo=True,
            data_fim__isnull=False,
            data_fim__gte=hoje - timedelta(days=LOCACAO_ANTES),
            data_fim__lte=hoje + timedelta(days=LOCACAO_DEPOIS),
        )
        .select_related("unidade__condominio", "pessoa")
        .order_by("data_fim")
    )


def _rateio_inconsistente() -> int:
    somas = (
        Unidade.objects.filter(ativo=True, condominio__ativo=True)
        .values("condominio")
        .annotate(soma=Sum("fracao_ideal"))
    )
    return sum(
        1 for linha in somas if abs(linha["soma"] - RATEIO_TOTAL) > RATEIO_TOLERANCIA
    )


class DashboardView(APIView):
    """Indicadores do painel inicial: o que pede ação (não apenas totais de cadastro)."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request):
        hoje = timezone.localdate()
        reajustes = _reajustes(hoje)
        locacoes = _locacoes_queryset(hoje)
        unidades_ativas = Unidade.objects.filter(ativo=True)

        data = {
            "condominios": _resumo(Condominio, "tipo", Condominio.TipoCondominio),
            "unidades": _resumo(Unidade, "tipo", Unidade.TipoUnidade),
            "pessoas": _resumo(Pessoa, "tipo_pessoa", Pessoa.TipoPessoa),
            "responsaveis": {
                "unidades_ativas": unidades_ativas.count(),
                "com_responsavel": unidades_ativas.filter(partes__isnull=False)
                .distinct()
                .count(),
            },
            "reajustes_por_mes": _reajustes_por_mes(reajustes, hoje),
            "proximos_reajustes": reajustes[:TOP_LISTAS],
            "receita_fixa": _receita_fixa(),
            "locacoes": [
                {
                    "id": parte.unidade_id,
                    "condominio": parte.unidade.condominio_id,
                    "condominio_nome": parte.unidade.condominio.nome,
                    "unidade": parte.unidade.nome_unidade,
                    "locatario": parte.pessoa.nome,
                    "data_fim": parte.data_fim,
                    "encerrada": parte.data_fim < hoje,
                }
                for parte in locacoes[:TOP_LISTAS]
            ],
            "pendencias": {
                "unidades_sem_responsavel": unidades_ativas.filter(
                    partes__isnull=True
                ).count(),
                "rateio_inconsistente": _rateio_inconsistente(),
                "reajustes_atrasados": sum(1 for r in reajustes if r["atrasado"]),
                "reajustes_30_dias": sum(
                    1
                    for r in reajustes
                    if hoje <= r["data"] <= hoje + timedelta(days=30)
                ),
                "locacoes_terminando": locacoes.count(),
                "sem_plano_contas": Condominio.objects.filter(
                    ativo=True, subcontas__isnull=True
                ).count(),
                "lancamentos_bloqueados": unidades_ativas.filter(
                    bloqueio_lancamentos=True
                ).count(),
            },
        }
        return Response(DashboardSerializer(data).data)
