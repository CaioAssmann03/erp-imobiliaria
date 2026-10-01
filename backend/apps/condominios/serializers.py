from rest_framework import serializers

from apps.pessoas.serializers import PessoaSerializer

from .models import Bloco, Condominio, Historico, SubConta, Unidade, UnidadeParte


class CondominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominio
        fields = "__all__"
        read_only_fields = ["id", "criado_em"]


class BlocoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bloco
        fields = "__all__"


class UnidadeParteSerializer(serializers.ModelSerializer):
    pessoa_detalhe = PessoaSerializer(source="pessoa", read_only=True)

    class Meta:
        model = UnidadeParte
        fields = [
            "id",
            "unidade",
            "pessoa",
            "pessoa_detalhe",
            "papel",
            "percentual_participacao",
            "senha_portal_hash",
            "bloqueado_portal",
            "data_inicio",
            "data_fim",
        ]
        extra_kwargs = {"senha_portal_hash": {"write_only": True}}


class UnidadeSerializer(serializers.ModelSerializer):
    partes = UnidadeParteSerializer(many=True, read_only=True)

    class Meta:
        model = Unidade
        fields = "__all__"
        read_only_fields = ["id", "criado_em"]


class SubContaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubConta
        fields = "__all__"


class HistoricoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historico
        fields = "__all__"
