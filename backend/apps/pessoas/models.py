from django.db import models


class Pessoa(models.Model):
    """Cadastro central de pessoas — reusado por todos os módulos (proprietário,
    locatário, síndico, fornecedor, corretor etc., via o papel de cada vínculo)."""

    class TipoPessoa(models.TextChoices):
        FISICA = "fisica", "Física"
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

    def __str__(self):
        return f"{self.nome} ({self.cpf_cnpj})"
