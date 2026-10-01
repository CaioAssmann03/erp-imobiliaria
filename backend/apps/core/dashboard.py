from datetime import date

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.condominios.models import Condominio, Unidade
from apps.pessoas.models import Pessoa

MESES_NO_GRAFICO = 6


class TotalPorTipoSerializer(serializers.Serializer):
    tipo = serializers.CharField()
    rotulo = serializers.CharField()
    total = serializers.IntegerField()


class ResumoSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    ativos = serializers.IntegerField()
    por_tipo = TotalPorTipoSerializer(many=True)


class CadastroMensalSerializer(serializers.Serializer):
    mes = serializers.CharField(help_text="AAAA-MM")
    condominios = serializers.IntegerField()
    unidades = serializers.IntegerField()
    pessoas = serializers.IntegerField()


class PendenciasSerializer(serializers.Serializer):
    condominios_incompletos = serializers.IntegerField(
        help_text="Condomínios ativos sem CNPJ ou sem CEP"
    )
    unidades_sem_vinculo = serializers.IntegerField(
        help_text="Unidades ativas sem proprietário/locatário vinculado"
    )
    pessoas_sem_contato = serializers.IntegerField(
        help_text="Pessoas ativas sem email nem celular"
    )


class DashboardSerializer(serializers.Serializer):
    pendencias = PendenciasSerializer()
    condominios = ResumoSerializer()
    unidades = ResumoSerializer()
    pessoas = ResumoSerializer()
    cadastros_por_mes = CadastroMensalSerializer(many=True)


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


def _pendencias():
    """Contagens de cadastros que pedem atenção (alimentam os badges de notificação)."""
    return {
        "condominios_incompletos": Condominio.objects.filter(ativo=True)
        .filter(Q(cnpj="") | Q(cep=""))
        .count(),
        "unidades_sem_vinculo": Unidade.objects.filter(ativo=True, partes__isnull=True).count(),
        "pessoas_sem_contato": Pessoa.objects.filter(ativo=True, email="", celular="").count(),
    }


def _ultimos_meses(quantidade):
    hoje = timezone.localdate()
    ano, mes = hoje.year, hoje.month
    meses = []
    for _ in range(quantidade):
        meses.append(date(ano, mes, 1))
        mes -= 1
        if mes == 0:
            ano, mes = ano - 1, 12
    return list(reversed(meses))


def _cadastros_por_mes(model, meses):
    linhas = (
        model.objects.filter(criado_em__date__gte=meses[0])
        .annotate(mes=TruncMonth("criado_em"))
        .values("mes")
        .annotate(n=Count("id"))
    )
    return {linha["mes"].date().replace(day=1): linha["n"] for linha in linhas}


class DashboardView(APIView):
    """Agregados exatos para o painel inicial."""

    @extend_schema(responses=DashboardSerializer, operation_id="dashboard_retrieve")
    def get(self, request):
        meses = _ultimos_meses(MESES_NO_GRAFICO)
        por_mes = {
            "condominios": _cadastros_por_mes(Condominio, meses),
            "unidades": _cadastros_por_mes(Unidade, meses),
            "pessoas": _cadastros_por_mes(Pessoa, meses),
        }
        data = {
            "pendencias": _pendencias(),
            "condominios": _resumo(Condominio, "tipo", Condominio.TipoCondominio),
            "unidades": _resumo(Unidade, "tipo", Unidade.TipoUnidade),
            "pessoas": _resumo(Pessoa, "tipo_pessoa", Pessoa.TipoPessoa),
            "cadastros_por_mes": [
                {"mes": mes.strftime("%Y-%m"), **{k: v.get(mes, 0) for k, v in por_mes.items()}}
                for mes in meses
            ],
        }
        return Response(DashboardSerializer(data).data)
