from rest_framework import serializers

from .models import Pessoa


class PessoaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pessoa
        fields = [
            "id",
            "tipo_pessoa",
            "nome",
            "cpf_cnpj",
            "rg_ie",
            "data_nascimento",
            "estado_civil",
            "profissao",
            "telefone_residencial",
            "telefone_comercial",
            "celular",
            "email",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]
