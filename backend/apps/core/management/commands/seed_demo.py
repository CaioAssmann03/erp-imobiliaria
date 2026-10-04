"""Dados de exemplo para visualizar o sistema: `seed_demo` cria, `seed_demo --clear` remove.

Idempotente: rodar de novo não duplica. Só mexe nos registros criados por este comando
(identificados por nome de condomínio e por CPF/CNPJ gerados de forma determinística).
"""

import random
from datetime import timedelta
from decimal import Decimal
from typing import Any

from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from typing_extensions import final, override

from apps.condominiums.models import (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.models import Company
from apps.financeiro.models import CostCenter
from apps.persons.models import PeopleIndividual, PeopleLegal, Person

CONDOMINIUMS = [
    # name, city, state, zip, type, fee(fixed|%), complete?, active?, blocks
    (
        "Residencial Jardim das Acácias",
        "São Paulo",
        "SP",
        "01310-100",
        "residential",
        ("fixed", "1850.00"),
        True,
        True,
        ["A", "B"],
    ),
    (
        "Edifício Vista Mar",
        "Santos",
        "SP",
        "11060-001",
        "residential",
        ("variable", "4.50"),
        True,
        True,
        [],
    ),
    (
        "Condomínio Parque Ibirapuera",
        "São Paulo",
        "SP",
        "04094-050",
        "residential",
        ("fixed", "2200.00"),
        True,
        True,
        ["Torre 1", "Torre 2"],
    ),
    (
        "Centro Empresarial Paulista",
        "São Paulo",
        "SP",
        "01452-000",
        "commercial",
        ("variable", "5.00"),
        True,
        True,
        [],
    ),
    (
        "Edifício Solar dos Ipês",
        "Campinas",
        "SP",
        "13015-100",
        "residential",
        ("fixed", "1500.00"),
        False,
        True,
        [],
    ),
    (
        "Residencial Bosque Verde",
        "Curitiba",
        "PR",
        "80010-000",
        "residential",
        ("fixed", "1700.00"),
        True,
        True,
        ["A"],
    ),
    (
        "Edifício Palácio das Artes",
        "Belo Horizonte",
        "MG",
        "",
        "commercial",
        ("fixed", "2600.00"),
        True,
        True,
        [],
    ),
    (
        "Condomínio Recanto do Sol",
        "Florianópolis",
        "SC",
        "88010-400",
        "residential",
        ("fixed", "1300.00"),
        True,
        False,
        [],
    ),
]

STREETS = [
    "Av. Paulista",
    "Rua das Flores",
    "Av. Brasil",
    "Rua Augusta",
    "Rua XV de Novembro",
    "Av. Atlântica",
]
DISTRICTS = ["Centro", "Jardim América", "Vila Nova", "Bela Vista", "Boa Viagem", "Moema"]

NAMES = [
    "Ana Beatriz Lima",
    "Carlos Eduardo Souza",
    "Mariana Costa Ribeiro",
    "João Pedro Almeida",
    "Fernanda Oliveira Santos",
    "Ricardo Mendes Pereira",
    "Patrícia Gomes Carvalho",
    "Lucas Martins Rocha",
    "Juliana Ferreira Dias",
    "Rafael Barbosa Nunes",
    "Camila Rodrigues Araújo",
    "Bruno Henrique Teixeira",
    "Aline Cardoso Moreira",
    "Thiago Azevedo Ramos",
    "Larissa Nascimento Freitas",
    "Gustavo Correia Pinto",
    "Renata Duarte Machado",
    "Felipe Cavalcanti Lopes",
    "Vanessa Monteiro Batista",
    "Diego Fonseca Campos",
]
COMPANIES = [
    "Construtora Horizonte Ltda",
    "Investimentos Alvorada S.A.",
    "Grupo Pinheiro Participações",
    "Imobiliária Boa Morada Ltda",
    "Holding Santa Clara Ltda",
    "Lojas Aurora Comércio Ltda",
]
UNIT_TYPES = {
    "residential": ["apartment"] * 6 + ["house", "parking_space"],
    "commercial": ["office"] * 4 + ["store", "suite"],
}
UNIT_NUMBERS = range(101, 120)

# Dias até o próximo reajuste de cada condomínio (negativo = atrasado; None = sem base).
ADJUSTMENT_IN_DAYS = [-20, 18, 40, 75, 110, 150, 240, None]
# Condomínios (índice) deixados de propósito com rateio fora de 1 e sem centros de custo.
WRONG_APPORTIONMENT = {4, 6}
WITHOUT_COST_CENTERS = {4, 6}
COST_CENTERS = ["Fundo de Reserva", "Fundo de Obras", "Água e Esgoto"]
# Dias até o fim de cada locação sorteada (negativo = já encerrada).
LEASE_END_IN_DAYS = [-12, 9, 25, 48, 90, None]



def _cpf(seed: int) -> str:
    digits = [int(c) for c in f"{100000000 + seed * 7919:09d}"[-9:]]
    for length in (9, 10):
        total = sum(d * (length + 1 - i) for i, d in enumerate(digits[:length]))
        digits.append((total * 10 % 11) % 10)
    return "".join(map(str, digits))


def _cnpj(seed: int) -> str:
    digits = [int(c) for c in f"{10000000 + seed * 104729:08d}"[-8:]] + [0, 0, 0, 1]
    for weights in (
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    ):
        total = sum(d * w for d, w in zip(digits, weights))
        rest = total % 11
        digits.append(0 if rest < 2 else 11 - rest)
    return "".join(map(str, digits))


def _demo_persons() -> list[tuple[str, str, str]]:
    """(name, kind, document) determinísticos."""
    items = [(n, "individual", _cpf(i + 1)) for i, n in enumerate(NAMES)]
    items += [(n, "legal", _cnpj(i + 1)) for i, n in enumerate(COMPANIES)]
    return items


def _phone(rng: random.Random) -> str:
    return f"(11) 9{rng.randint(1000, 9999)}-{rng.randint(1000, 9999)}"


def _when(rng: random.Random, max_days: int):  # noqa: ANN202
    return timezone.now() - timedelta(
        days=rng.randint(1, max_days), hours=rng.randint(0, 23)
    )


@final
class Command(BaseCommand):
    help = "Cria (ou remove, com --clear) dados de exemplo: condomínios, unidades, pessoas e vínculos."

    @override
    def add_arguments(self, parser: CommandParser) -> None:
        _ = parser.add_argument(
            "--clear", action="store_true", help="Remove os dados de exemplo."
        )

    @override
    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        if options["clear"]:
            self._clear()
            return
        self._create()

    def _clear(self) -> None:
        names = [c[0] for c in CONDOMINIUMS]
        condominiums = Condominium.objects.filter(name__in=names)
        # Address é OneToOne com SET_NULL: apagar o condomínio deixaria o endereço órfão.
        _ = Address.objects.filter(condominium__in=condominiums).delete()
        condos, _ = condominiums.delete()
        docs = [p[2] for p in _demo_persons()]
        persons, _ = Person.objects.filter(
            Q(people_individual__cpf__in=docs) | Q(people_legal__cnpj__in=docs)
        ).delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Removidos: {condos} registros de condomínios (com unidades/vínculos) e {persons} de pessoas."
            )
        )

    def _finalize(self, rng: random.Random) -> None:
        """Rateio (frações somando 1), centros de custo e bloqueios dos condomínios de exemplo."""
        for index, definition in enumerate(CONDOMINIUMS):
            condominium = Condominium.objects.filter(name=definition[0]).first()
            if (
                condominium is None
                or condominium.units.filter(ideal_fraction__gt=0).exists()
            ):
                continue  # inexistente ou já finalizado (execução repetida)

            active_units = list(condominium.units.filter(active=True))
            weights = [rng.uniform(0.8, 1.4) for _ in active_units]
            factor = Decimal("0.9") if index in WRONG_APPORTIONMENT else Decimal("1")
            total_weights = sum(weights)
            fractions = [
                Decimal(f"{weight / total_weights:.8f}") * factor for weight in weights
            ]
            if active_units and index not in WRONG_APPORTIONMENT:
                fractions[-1] += Decimal("1") - sum(fractions)  # fecha exatamente em 1
            for unit, fraction in zip(active_units, fractions):
                _ = Unit.objects.filter(pk=unit.pk).update(
                    ideal_fraction=fraction.quantize(Decimal("0.00000001"))
                )

            if index not in WITHOUT_COST_CENTERS:
                for name in COST_CENTERS:
                    _ = CostCenter.objects.get_or_create(
                        condominium=condominium, name=name
                    )

        # Um condomínio com uma unidade de cobrança bloqueada.
        target = Unit.objects.filter(
            condominium__name=CONDOMINIUMS[0][0], active=True
        ).first()
        if target:
            _ = Unit.objects.filter(pk=target.pk).update(is_billing_blocked=True)

    def _create_persons(self, rng: random.Random) -> list[Person]:
        persons: list[Person] = []
        for index, (name, kind, document) in enumerate(_demo_persons()):
            missing_contact = index % 7 == 3  # algumas pessoas sem email/celular
            slug = name.lower().replace(" ", ".").replace(".ltda", "").replace(".s.a.", "")
            existing = Person.objects.filter(
                Q(people_individual__cpf=document) | Q(people_legal__cnpj=document)
            ).first()
            if existing is not None:
                persons.append(existing)
                continue
            person = Person.objects.create(
                name=name,
                cell_number=None if missing_contact else _phone(rng),
                email="" if missing_contact else f"{slug[:24]}@exemplo.com.br",
                active=index % 11 != 10,
            )
            if kind == "individual":
                _ = PeopleIndividual.objects.create(
                    person=person,
                    cpf=document,
                    marital_status=rng.choice(
                        ["Solteiro(a)", "Casado(a)", "Divorciado(a)"]
                    ),
                    job=rng.choice(
                        [
                            "Engenheiro(a)",
                            "Médico(a)",
                            "Advogado(a)",
                            "Professor(a)",
                            "Empresário(a)",
                        ]
                    ),
                )
            else:
                _ = PeopleLegal.objects.create(person=person, cnpj=document)
            _ = Person.objects.filter(pk=person.pk).update(
                created_at=_when(rng, 170)
            )
            persons.append(person)
        return persons

    def _create(self) -> None:
        rng = random.Random(42)
        company = Company.objects.first()
        if company is None:
            _ = self.stderr.write("Nenhuma Company cadastrada; crie uma antes.")
            return

        persons = self._create_persons(rng)
        active_persons = [p for p in persons if p.active] or persons

        total_units = total_links = 0
        for index, (
            name,
            city,
            state,
            zip_code,
            kind,
            (fee_type, value),
            complete,
            active,
            blocks,
        ) in enumerate(CONDOMINIUMS):
            if Condominium.objects.filter(name=name).exists():
                continue

            today = timezone.localdate()
            address = (
                Address.objects.create(
                    zip_code=zip_code.replace("-", "") or None,
                    street=STREETS[index % len(STREETS)],
                    number=str(rng.randint(100, 2500)),
                    district=DISTRICTS[index % len(DISTRICTS)],
                    city=city,
                    state=state,
                )
                if complete
                else None
            )
            condominium = Condominium.objects.create(
                company=company,
                address=address,
                name=name,
                cnpj=_cnpj(100 + index),
                type=kind,
                active=active,
            )
            _ = Condominium.objects.filter(pk=condominium.pk).update(
                created_at=_when(rng, 175)
            )

            adjustment_in = ADJUSTMENT_IN_DAYS[index]
            _ = AdministrationContract.objects.create(
                condominium=condominium,
                fee_type=fee_type,
                fee_amount=Decimal(value) if fee_type == "fixed" else None,
                fee_percentage=Decimal(value) if fee_type == "variable" else None,
                fee_basis="revenue" if fee_type == "variable" else None,
                adjustment_index="IGPM",
                adjustment_period_months=12,
                adjustment_base_date=(
                    today + timedelta(days=adjustment_in) - relativedelta(months=12)
                    if adjustment_in is not None
                    else None
                ),
            )
            _ = BillingRules.objects.create(
                condominium=condominium, due_day=rng.choice([5, 10, 15])
            )

            block_objs = [
                Block.objects.create(condominium=condominium, name=b) for b in blocks
            ]
            for number in range(rng.randint(5, 8)):
                unit = Unit.objects.create(
                    condominium=condominium,
                    block=block_objs[number % len(block_objs)] if block_objs else None,
                    name=str(UNIT_NUMBERS[number] + (number // 4) * 100),
                    type=rng.choice(UNIT_TYPES[kind]),
                    resident_count=rng.randint(0, 5) if kind == "residential" else 0,
                    gas_value=Decimal(f"{rng.uniform(0, 60):.2f}")
                    if rng.random() < 0.4
                    else Decimal("0"),
                    water_value=Decimal(f"{rng.uniform(0, 90):.2f}")
                    if rng.random() < 0.5
                    else Decimal("0"),
                    active=rng.random() > 0.08,
                )
                _ = Unit.objects.filter(pk=unit.pk).update(created_at=_when(rng, 170))
                total_units += 1

                # ~12% das unidades ativas ficam sem vínculo (gera pendência).
                if unit.active and rng.random() < 0.12:
                    continue
                owner = rng.choice(active_persons)
                _ = UnitPerson.objects.create(
                    unit=unit,
                    person=owner,
                    role=UnitPerson.Role.OWNER,
                    ownership_percentage=Decimal("100"),
                    start_date=today - timedelta(days=rng.randint(700, 2000)),
                )
                total_links += 1
                if rng.random() < 0.3:
                    tenant = rng.choice([p for p in active_persons if p.pk != owner.pk])
                    days_to_end = rng.choice(LEASE_END_IN_DAYS)
                    _ = UnitPerson.objects.create(
                        unit=unit,
                        person=tenant,
                        role=UnitPerson.Role.TENANT,
                        start_date=today - timedelta(days=rng.randint(200, 700)),
                        end_date=today + timedelta(days=days_to_end)
                        if days_to_end is not None
                        else None,
                    )
                    total_links += 1

        self._finalize(rng)

        self.stdout.write(
            self.style.SUCCESS(
                f"Dados de exemplo prontos: {len(persons)} pessoas, {len(CONDOMINIUMS)} condomínios, "
                f"{total_units} unidades e {total_links} vínculos."
            )
        )
