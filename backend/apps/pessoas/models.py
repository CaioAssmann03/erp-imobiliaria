from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models.functions import Upper

from apps.core.sql import so_digitos


class Pessoa(models.Model):
    """Cadastro central de pessoas — reusado por todos os módulos (proprietário,
    locatário, síndico, fornecedor, corretor etc., via o papel de cada vínculo)."""

    class TipoPessoa(models.TextChoices):
        FISICA = 'fisica', 'Física'
        JURIDICA = "juridica", "Jurídica"

    tipo_pessoa = models.CharField(max_length=10, choices=TipoPessoa.choices, default=TipoPessoa.FISICA)
    nome = models.CharField(max_length=255)
    cpf_cnpj = models.CharField(max_length=18, unique=True)
    rg_ie = models.CharField(max_length=20, blank=True)

    data_nascimento = models.DateField(null=True, blank=True)
    estado_civil = models.CharField(max_length=30, blank=True)
    profissao = models.CharField(max_length=120, blank=True)

    telefone_residencial = models.CharField(max_length=20, blank=True)
    telefone_comercial = models.CharField(max_length=20, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pessoa"
        verbose_name_plural = "Pessoas"
        ordering = ["nome"]
        indexes = [
            # Busca por trecho (icontains) sem varrer a tabela — ver apps/core/search.py
            GinIndex(OpClass(Upper("nome"), name="gin_trgm_ops"), name="pessoa_nome_trgm"),
            GinIndex(OpClass(Upper("cpf_cnpj"), name="gin_trgm_ops"), name="pessoa_doc_trgm"),
            # CPF/CNPJ só com dígitos (busca sem pontuação)
            GinIndex(OpClass(so_digitos("cpf_cnpj"), name="gin_trgm_ops"), name="pessoa_doc_digitos_trgm"),
        ]

    def __str__(self):
        return f"{self.nome} ({self.cpf_cnpj})"
