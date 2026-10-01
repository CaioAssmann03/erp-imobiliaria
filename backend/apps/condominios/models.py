from django.db import models

from apps.core.models import Empresa
from apps.pessoas.models import Pessoa


class Condominio(models.Model):
    class TipoCondominio(models.TextChoices):
        RESIDENCIAL = "residencial", "Residencial"
        COMERCIAL = "comercial", "Comercial"

    class TipoTaxaAdministracao(models.TextChoices):
        FIXA = "fixa", "Fixa"
        VARIAVEL = "variavel", "Variável"

    class CompetenciaCalculo(models.TextChoices):
        REFERENCIA = "referencia", "Referência do cálculo"
        POSTERIOR = "posterior", "Posterior à referência"

    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="condominios")
    nome = models.CharField(max_length=255)
    assessor = models.ForeignKey(Pessoa, on_delete=models.SET_NULL, null=True, blank=True, related_name="condominios_assessorados")

    cnpj = models.CharField(max_length=18, blank=True)
    inscricao_municipal = models.CharField(max_length=30, blank=True)

    cep = models.CharField(max_length=9, blank=True)
    logradouro = models.CharField(max_length=255, blank=True)
    bairro = models.CharField(max_length=120, blank=True)
    cidade = models.CharField(max_length=120, blank=True)
    uf = models.CharField(max_length=2, blank=True)

    hidrometro = models.CharField(max_length=30, blank=True)
    relogio_luz = models.CharField(max_length=30, blank=True)
    tipo = models.CharField(max_length=20, choices=TipoCondominio.choices, default=TipoCondominio.RESIDENCIAL)

    data_inicio_administracao = models.DateField(null=True, blank=True)
    base_reajuste = models.DateField(null=True, blank=True)
    periodicidade_reajuste_meses = models.PositiveSmallIntegerField(default=12)
    indice_reajuste = models.CharField(max_length=30, blank=True, help_text="Ex.: IGPM, INCC")

    tipo_taxa_administracao = models.CharField(max_length=10, choices=TipoTaxaAdministracao.choices, default=TipoTaxaAdministracao.FIXA)
    valor_taxa_administracao = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    percentual_taxa_administracao = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cobra_iss_sobre_taxa = models.BooleanField(default=False)

    dia_vencimento_documento = models.PositiveSmallIntegerField(default=10)
    vencimento_por_dia_util = models.BooleanField(default=False)
    competencia_calculo = models.CharField(max_length=12, choices=CompetenciaCalculo.choices, default=CompetenciaCalculo.REFERENCIA)

    percentual_desconto_pagamento_dia = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    dias_antes_vencimento_desconto = models.PositiveSmallIntegerField(default=0)

    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Condomínio"
        verbose_name_plural = "Condomínios"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Bloco(models.Model):
    condominio = models.ForeignKey(Condominio, on_delete=models.CASCADE, related_name="blocos")
    nome = models.CharField(max_length=60)

    class Meta:
        verbose_name = "Bloco"
        verbose_name_plural = "Blocos"
        unique_together = ["condominio", "nome"]

    def __str__(self):
        return f"{self.condominio.nome} — Bloco {self.nome}"


class Unidade(models.Model):
    class TipoUnidade(models.TextChoices):
        APARTAMENTO = "apartamento", "Apartamento"
        SALA = "sala", "Sala"
        LOJA = "loja", "Loja"
        CASA = "casa", "Casa"
        CONJUNTO = "conjunto", "Conjunto"
        BOX = "box", "Box"
        OUTROS = "outros", "Outros"

    condominio = models.ForeignKey(Condominio, on_delete=models.CASCADE, related_name="unidades")
    bloco = models.ForeignKey(Bloco, on_delete=models.SET_NULL, null=True, blank=True, related_name="unidades")
    nome_unidade = models.CharField(max_length=30, help_text="Ex.: 101")

    tipo = models.CharField(max_length=20, choices=TipoUnidade.choices, default=TipoUnidade.APARTAMENTO)
    numero_moradores = models.PositiveSmallIntegerField(default=0)
    fracao_ideal = models.DecimalField(max_digits=8, decimal_places=5, default=0, help_text="Usada no rateio")

    eh_unidade_sindico = models.BooleanField(default=False)
    esta_alugada = models.BooleanField(default=False)
    matricula_imovel = models.CharField(max_length=60, blank=True)

    valor_gas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    valor_agua = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    valor_energia = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    bloqueio_lancamentos = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Unidade"
        verbose_name_plural = "Unidades"
        unique_together = ["condominio", "nome_unidade"]
        ordering = ["condominio", "nome_unidade"]

    def __str__(self):
        return f"{self.condominio.nome} — {self.nome_unidade}"


class UnidadeParte(models.Model):
    """Vínculo N:N entre Unidade e Pessoa — já suporta copropriedade
    (mais de um proprietário por unidade, com % de participação)."""

    class Papel(models.TextChoices):
        PROPRIETARIO = "proprietario", "Proprietário"
        LOCATARIO = "locatario", "Locatário"

    unidade = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name="partes")
    pessoa = models.ForeignKey(Pessoa, on_delete=models.PROTECT, related_name="unidades_vinculadas")
    papel = models.CharField(max_length=20, choices=Papel.choices)
    percentual_participacao = models.DecimalField(max_digits=5, decimal_places=2, default=100)

    senha_portal_hash = models.CharField(max_length=255, blank=True)
    bloqueado_portal = models.BooleanField(default=False)

    data_inicio = models.DateField(null=True, blank=True)
    data_fim = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Vínculo de Unidade"
        verbose_name_plural = "Vínculos de Unidade"

    def __str__(self):
        return f"{self.pessoa.nome} ({self.get_papel_display()}) — {self.unidade}"


class SubConta(models.Model):
    """Plano de contas do condomínio (ex.: Fundo de Obras, Garagem) — usado
    como centro de custo em ContaPagar e nos itens de cobrança."""

    condominio = models.ForeignKey(Condominio, on_delete=models.CASCADE, related_name="subcontas")
    nome = models.CharField(max_length=120)

    class Meta:
        verbose_name = "Sub-conta"
        verbose_name_plural = "Sub-contas"
        unique_together = ["condominio", "nome"]

    def __str__(self):
        return f"{self.condominio.nome} — {self.nome}"


class Historico(models.Model):
    """Histórico Padrão — mais granular que a SubConta (ex.: 'PG. DMAE',
    '0052-CONDOMINIO'); cada Histórico aponta para uma SubConta por padrão."""

    nome = models.CharField(max_length=120)
    subconta = models.ForeignKey(SubConta, on_delete=models.PROTECT, related_name="historicos")
    ativo = models.BooleanField(default=True)
    historico_de_acumulo = models.BooleanField(default=False)
    acumula_para_balanco = models.BooleanField(default=True)
    incide_previdencia = models.BooleanField(default=False)
    percentual_incidencia_taxa_adm = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Histórico"
        verbose_name_plural = "Históricos"

    def __str__(self):
        return self.nome
