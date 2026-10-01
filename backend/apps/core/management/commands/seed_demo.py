"""Dados de exemplo para visualizar o sistema: `seed_demo` cria, `seed_demo --clear` remove.

Idempotente: rodar de novo não duplica. Só mexe nos registros criados por este comando
(identificados por nome de condomínio e por CPF/CNPJ gerados de forma determinística).
"""
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.condominios.models import Bloco, Condominio, Unidade, UnidadeParte
from apps.core.models import Empresa
from apps.pessoas.models import Pessoa

CONDOMINIOS = [
    # nome, cidade, uf, cep, tipo, taxa(fixa|%), completo?, ativo?, blocos
    ("Residencial Jardim das Acácias", "São Paulo", "SP", "01310-100", "residencial", ("fixa", "1850.00"), True, True, ["A", "B"]),
    ("Edifício Vista Mar", "Santos", "SP", "11060-001", "residencial", ("variavel", "4.50"), True, True, []),
    ("Condomínio Parque Ibirapuera", "São Paulo", "SP", "04094-050", "residencial", ("fixa", "2200.00"), True, True, ["Torre 1", "Torre 2"]),
    ("Centro Empresarial Paulista", "São Paulo", "SP", "01452-000", "comercial", ("variavel", "5.00"), True, True, []),
    ("Edifício Solar dos Ipês", "Campinas", "SP", "13015-100", "residencial", ("fixa", "1500.00"), False, True, []),
    ("Residencial Bosque Verde", "Curitiba", "PR", "80010-000", "residencial", ("fixa", "1700.00"), True, True, ["A"]),
    ("Edifício Palácio das Artes", "Belo Horizonte", "MG", "", "comercial", ("fixa", "2600.00"), True, True, []),
    ("Condomínio Recanto do Sol", "Florianópolis", "SC", "88010-400", "residencial", ("fixa", "1300.00"), True, False, []),
]

LOGRADOUROS = ["Av. Paulista", "Rua das Flores", "Av. Brasil", "Rua Augusta", "Rua XV de Novembro", "Av. Atlântica"]
BAIRROS = ["Centro", "Jardim América", "Vila Nova", "Bela Vista", "Boa Viagem", "Moema"]

NOMES = [
    "Ana Beatriz Lima", "Carlos Eduardo Souza", "Mariana Costa Ribeiro", "João Pedro Almeida",
    "Fernanda Oliveira Santos", "Ricardo Mendes Pereira", "Patrícia Gomes Carvalho", "Lucas Martins Rocha",
    "Juliana Ferreira Dias", "Rafael Barbosa Nunes", "Camila Rodrigues Araújo", "Bruno Henrique Teixeira",
    "Aline Cardoso Moreira", "Thiago Azevedo Ramos", "Larissa Nascimento Freitas", "Gustavo Correia Pinto",
    "Renata Duarte Machado", "Felipe Cavalcanti Lopes", "Vanessa Monteiro Batista", "Diego Fonseca Campos",
]
EMPRESAS = [
    "Construtora Horizonte Ltda", "Investimentos Alvorada S.A.", "Grupo Pinheiro Participações",
    "Imobiliária Boa Morada Ltda", "Holding Santa Clara Ltda", "Lojas Aurora Comércio Ltda",
]
TIPOS_UNIDADE = {
    "residencial": ["apartamento"] * 6 + ["casa", "box"],
    "comercial": ["sala"] * 4 + ["loja", "conjunto"],
}
RUAS_NUM = range(101, 120)


def _cpf(seed: int) -> str:
    digits = [int(c) for c in f"{100000000 + seed * 7919:09d}"[-9:]]
    for length in (9, 10):
        total = sum(d * (length + 1 - i) for i, d in enumerate(digits[:length]))
        digits.append((total * 10 % 11) % 10)
    n = "".join(map(str, digits))
    return f"{n[:3]}.{n[3:6]}.{n[6:9]}-{n[9:]}"


def _cnpj(seed: int) -> str:
    digits = [int(c) for c in f"{10000000 + seed * 104729:08d}"[-8:]] + [0, 0, 0, 1]
    for weights in ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]):
        total = sum(d * w for d, w in zip(digits, weights))
        rest = total % 11
        digits.append(0 if rest < 2 else 11 - rest)
    n = "".join(map(str, digits))
    return f"{n[:2]}.{n[2:5]}.{n[5:8]}/{n[8:12]}-{n[12:]}"


def _pessoas_demo():
    """(nome, tipo, documento) determinísticos."""
    items = [(n, "fisica", _cpf(i + 1)) for i, n in enumerate(NOMES)]
    items += [(n, "juridica", _cnpj(i + 1)) for i, n in enumerate(EMPRESAS)]
    return items


def _phone(rng: random.Random) -> str:
    return f"(11) 9{rng.randint(1000, 9999)}-{rng.randint(1000, 9999)}"


def _when(rng: random.Random, max_days: int):
    return timezone.now() - timedelta(days=rng.randint(1, max_days), hours=rng.randint(0, 23))


class Command(BaseCommand):
    help = "Cria (ou remove, com --clear) dados de exemplo: condomínios, unidades, pessoas e vínculos."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Remove os dados de exemplo.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self._clear()
            return
        self._create()

    def _clear(self):
        nomes = [c[0] for c in CONDOMINIOS]
        condos, _ = Condominio.objects.filter(nome__in=nomes).delete()
        docs = [p[2] for p in _pessoas_demo()]
        pessoas, _ = Pessoa.objects.filter(cpf_cnpj__in=docs).delete()
        self.stdout.write(self.style.SUCCESS(f"Removidos: {condos} registros de condomínios (com unidades/vínculos) e {pessoas} de pessoas."))

    def _create(self):
        rng = random.Random(42)
        empresa = Empresa.objects.first()
        if empresa is None:
            self.stderr.write("Nenhuma Empresa cadastrada; crie uma antes.")
            return

        # Pessoas
        pessoas, sem_contato = [], 0
        for index, (nome, tipo, doc) in enumerate(_pessoas_demo()):
            contato_faltando = index % 7 == 3  # algumas pessoas sem email/celular (gera pendência)
            slug = nome.lower().replace(" ", ".").replace(".ltda", "").replace(".s.a.", "")
            pessoa, created = Pessoa.objects.get_or_create(
                cpf_cnpj=doc,
                defaults={
                    "nome": nome,
                    "tipo_pessoa": tipo,
                    "celular": "" if contato_faltando else _phone(rng),
                    "email": "" if contato_faltando else f"{slug[:24]}@exemplo.com.br",
                    "estado_civil": rng.choice(["Solteiro(a)", "Casado(a)", "Divorciado(a)"]) if tipo == "fisica" else "",
                    "profissao": rng.choice(["Engenheiro(a)", "Médico(a)", "Advogado(a)", "Professor(a)", "Empresário(a)"]) if tipo == "fisica" else "",
                    "ativo": index % 11 != 10,
                },
            )
            sem_contato += contato_faltando
            if created:
                Pessoa.objects.filter(pk=pessoa.pk).update(criado_em=_when(rng, 170))
            pessoas.append(pessoa)
        ativas = [p for p in pessoas if p.ativo] or pessoas

        # Condomínios, blocos, unidades e vínculos
        total_unidades = total_partes = 0
        for index, (nome, cidade, uf, cep, tipo, (tipo_taxa, valor), completo, ativo, blocos) in enumerate(CONDOMINIOS):
            condominio, created = Condominio.objects.get_or_create(
                nome=nome,
                defaults={
                    "empresa": empresa,
                    "cnpj": _cnpj(100 + index) if completo else "",
                    "cep": cep,
                    "logradouro": f"{LOGRADOUROS[index % len(LOGRADOUROS)]}, {rng.randint(100, 2500)}",
                    "bairro": BAIRROS[index % len(BAIRROS)],
                    "cidade": cidade,
                    "uf": uf,
                    "tipo": tipo,
                    "tipo_taxa_administracao": tipo_taxa,
                    "valor_taxa_administracao": Decimal(valor) if tipo_taxa == "fixa" else Decimal("0"),
                    "percentual_taxa_administracao": Decimal(valor) if tipo_taxa == "variavel" else None,
                    "dia_vencimento_documento": rng.choice([5, 10, 15]),
                    "indice_reajuste": "IGPM",
                    "ativo": ativo,
                },
            )
            if not created:
                continue
            Condominio.objects.filter(pk=condominio.pk).update(criado_em=_when(rng, 175))

            blocos_obj = [Bloco.objects.create(condominio=condominio, nome=b) for b in blocos]
            quantidade = rng.randint(5, 8)
            for numero in range(quantidade):
                unidade = Unidade.objects.create(
                    condominio=condominio,
                    bloco=blocos_obj[numero % len(blocos_obj)] if blocos_obj else None,
                    nome_unidade=str(RUAS_NUM[numero] + (numero // 4) * 100),
                    tipo=rng.choice(TIPOS_UNIDADE[tipo]),
                    numero_moradores=rng.randint(0, 5) if tipo == "residencial" else 0,
                    fracao_ideal=Decimal(f"{rng.uniform(0.5, 3.5):.5f}"),
                    valor_gas=Decimal(f"{rng.uniform(0, 60):.2f}") if rng.random() < 0.4 else Decimal("0"),
                    valor_agua=Decimal(f"{rng.uniform(0, 90):.2f}") if rng.random() < 0.5 else Decimal("0"),
                    esta_alugada=rng.random() < 0.3,
                    ativo=rng.random() > 0.08,
                )
                Unidade.objects.filter(pk=unidade.pk).update(criado_em=_when(rng, 170))
                total_unidades += 1

                # ~12% das unidades ativas ficam sem vínculo (gera pendência).
                if unidade.ativo and rng.random() < 0.12:
                    continue
                dono = rng.choice(ativas)
                UnidadeParte.objects.create(unidade=unidade, pessoa=dono, papel="proprietario")
                total_partes += 1
                if unidade.esta_alugada:
                    inquilino = rng.choice([p for p in ativas if p.pk != dono.pk])
                    UnidadeParte.objects.create(unidade=unidade, pessoa=inquilino, papel="locatario")
                    total_partes += 1

        self.stdout.write(self.style.SUCCESS(
            f"Dados de exemplo prontos: {len(pessoas)} pessoas, {len(CONDOMINIOS)} condomínios, "
            f"{total_unidades} unidades e {total_partes} vínculos criados agora."
        ))
