"""Dados de exemplo para visualizar o sistema: `seed_demo` cria, `seed_demo --clear` remove.

Idempotente: rodar de novo não duplica. Só mexe nos registros criados por este comando
(identificados por nome de condomínio e por CPF/CNPJ gerados de forma determinística).
"""

import random
import re
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, TypeVar

from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandParser
from django.db import models, transaction
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
from apps.finance.models import CostCenter
from apps.persons.models import PeopleIndividual, PeopleLegal, Person

WRONG_APPORTIONMENT_TOTAL = Decimal("0.9")  # fractions that do not close at 1 (shows the pendency)

ModelT = TypeVar("ModelT", bound=models.Model)


def _create_validated(model_class: type[ModelT], **fields: Any) -> ModelT:
    """Create a record only after the model's own rules (`full_clean()`) accept it."""
    record = model_class(**fields)
    record.full_clean()
    record.save()
    return record


def _save_validated(record: models.Model) -> None:
    """Save a changed record only after the model's own rules accept it."""
    record.full_clean()
    record.save()


@dataclass(frozen=True)
class DemoCondominium:
    """Definition of one demo condominium (what the seed will create)."""

    name: str
    city: str
    state: str
    zip_code: str
    kind: str  # Condominium type: "residential" | "commercial"
    fee_type: str  # "fixed" (value in R$) | "variable" (value in %)
    fee_value: str
    has_address: bool  # False leaves the condominium without an address
    active: bool
    block_names: list[str]
    days_until_adjustment: int | None  # negative = overdue; None = no adjustment base date
    has_wrong_apportionment: bool = False  # fractions sum 0.9 (shows the pendency)
    has_cost_centers: bool = True


DEMO_CONDOMINIUMS = [
    DemoCondominium(
        name="Residencial Jardim das Acácias",
        city="São Paulo",
        state="SP",
        zip_code="01310-100",
        kind="residential",
        fee_type="fixed",
        fee_value="1850.00",
        has_address=True,
        active=True,
        block_names=["A", "B"],
        days_until_adjustment=-20,
    ),
    DemoCondominium(
        name="Edifício Vista Mar",
        city="Santos",
        state="SP",
        zip_code="11060-001",
        kind="residential",
        fee_type="variable",
        fee_value="4.50",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=18,
    ),
    DemoCondominium(
        name="Condomínio Parque Ibirapuera",
        city="São Paulo",
        state="SP",
        zip_code="04094-050",
        kind="residential",
        fee_type="fixed",
        fee_value="2200.00",
        has_address=True,
        active=True,
        block_names=["Torre 1", "Torre 2"],
        days_until_adjustment=40,
    ),
    DemoCondominium(
        name="Centro Empresarial Paulista",
        city="São Paulo",
        state="SP",
        zip_code="01452-000",
        kind="commercial",
        fee_type="variable",
        fee_value="5.00",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=75,
    ),
    DemoCondominium(
        name="Edifício Solar dos Ipês",
        city="Campinas",
        state="SP",
        zip_code="13015-100",
        kind="residential",
        fee_type="fixed",
        fee_value="1500.00",
        has_address=False,
        active=True,
        block_names=[],
        days_until_adjustment=110,
        has_wrong_apportionment=True,
        has_cost_centers=False,
    ),
    DemoCondominium(
        name="Residencial Bosque Verde",
        city="Curitiba",
        state="PR",
        zip_code="80010-000",
        kind="residential",
        fee_type="fixed",
        fee_value="1700.00",
        has_address=True,
        active=True,
        block_names=["A"],
        days_until_adjustment=150,
    ),
    DemoCondominium(
        name="Edifício Palácio das Artes",
        city="Belo Horizonte",
        state="MG",
        zip_code="",
        kind="commercial",
        fee_type="fixed",
        fee_value="2600.00",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=240,
        has_wrong_apportionment=True,
        has_cost_centers=False,
    ),
    DemoCondominium(
        name="Condomínio Recanto do Sol",
        city="Florianópolis",
        state="SC",
        zip_code="88010-400",
        kind="residential",
        fee_type="fixed",
        fee_value="1300.00",
        has_address=True,
        active=False,
        block_names=[],
        days_until_adjustment=None,
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

COST_CENTERS = ["Fundo de Reserva", "Fundo de Obras", "Água e Esgoto"]
# Dias até o fim de cada locação sorteada (negativo = já encerrada).
DAYS_UNTIL_LEASE_END = [-12, 9, 25, 48, 90, None]



def _generate_cpf(seed: int) -> str:
    digits = [int(char) for char in f"{100000000 + seed * 7919:09d}"[-9:]]
    for length in (9, 10):
        weighted_sum = sum(
            digit * (length + 1 - position) for position, digit in enumerate(digits[:length])
        )
        digits.append((weighted_sum * 10 % 11) % 10)
    return "".join(map(str, digits))


def _generate_cnpj(seed: int) -> str:
    digits = [int(char) for char in f"{10000000 + seed * 104729:08d}"[-8:]] + [0, 0, 0, 1]
    for weights in (
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    ):
        weighted_sum = sum(digit * weight for digit, weight in zip(digits, weights))
        remainder = weighted_sum % 11
        digits.append(0 if remainder < 2 else 11 - remainder)
    return "".join(map(str, digits))


def _demo_person_definitions() -> list[tuple[str, str, str]]:
    """(name, kind, document) determinísticos."""
    definitions = [
        (name, "individual", _generate_cpf(position + 1)) for position, name in enumerate(NAMES)
    ]
    definitions += [
        (name, "legal", _generate_cnpj(position + 1)) for position, name in enumerate(COMPANIES)
    ]
    return definitions


def _random_phone(random_generator: random.Random) -> str:
    return f"(11) 9{random_generator.randint(1000, 9999)}-{random_generator.randint(1000, 9999)}"


def _random_past_datetime(random_generator: random.Random, max_days_ago: int) -> datetime:
    return timezone.now() - timedelta(
        days=random_generator.randint(1, max_days_ago), hours=random_generator.randint(0, 23)
    )


@final
@dataclass(frozen=True)
class SeedContext:
    """What every creation step of the seed needs."""

    random_generator: random.Random
    company: Company
    active_persons: list[Person]
    today: date


def _random_utility_value(
    random_generator: random.Random, maximum: int, probability: float
) -> Decimal:
    if random_generator.random() < probability:
        return Decimal(f"{random_generator.uniform(0, maximum):.2f}")
    return Decimal("0")


def _random_unit_fields(context: SeedContext, condominium_kind: str) -> dict[str, Any]:
    random_generator = context.random_generator
    is_residential = condominium_kind == "residential"
    return {
        "type": random_generator.choice(UNIT_TYPES[condominium_kind]),
        "resident_count": random_generator.randint(0, 5) if is_residential else 0,
        "gas_value": _random_utility_value(random_generator, 60, 0.4),
        "water_value": _random_utility_value(random_generator, 90, 0.5),
        "active": random_generator.random() > 0.08,
    }


def _create_address(context: SeedContext, position: int, demo: DemoCondominium) -> Address | None:
    if not demo.has_address:
        return None
    return _create_validated(
        Address,
        zip_code=demo.zip_code.replace("-", "") or None,
        street=STREETS[position % len(STREETS)],
        number=str(context.random_generator.randint(100, 2500)),
        district=DISTRICTS[position % len(DISTRICTS)],
        city=demo.city,
        state=demo.state,
    )


def _create_administration_contract(
    context: SeedContext, condominium: Condominium, demo: DemoCondominium
) -> None:
    days_until_adjustment = demo.days_until_adjustment
    is_fixed = demo.fee_type == "fixed"
    adjustment_base_date = (
        context.today + timedelta(days=days_until_adjustment) - relativedelta(months=12)
        if days_until_adjustment is not None
        else None
    )
    _ = _create_validated(
        AdministrationContract,
        condominium=condominium,
        fee_type=demo.fee_type,
        fee_amount=Decimal(demo.fee_value) if is_fixed else None,
        fee_percentage=None if is_fixed else Decimal(demo.fee_value),
        fee_basis=None if is_fixed else "revenue",
        adjustment_index="IGPM",
        adjustment_period_months=12,
        adjustment_base_date=adjustment_base_date,
    )


def _create_owner_link(context: SeedContext, unit: Unit) -> UnitPerson:
    random_generator = context.random_generator
    return _create_validated(
        UnitPerson,
        unit=unit,
        person=random_generator.choice(context.active_persons),
        role=UnitPerson.Role.OWNER,
        ownership_percentage=Decimal("100"),
        start_date=context.today - timedelta(days=random_generator.randint(700, 2000)),
    )


def _create_tenant_link(context: SeedContext, unit: Unit, owner: UnitPerson) -> UnitPerson:
    random_generator = context.random_generator
    tenant = random_generator.choice(
        [person for person in context.active_persons if person.pk != owner.person_id]
    )
    days_until_lease_end = random_generator.choice(DAYS_UNTIL_LEASE_END)
    return _create_validated(
        UnitPerson,
        unit=unit,
        person=tenant,
        role=UnitPerson.Role.TENANT,
        start_date=context.today - timedelta(days=random_generator.randint(200, 700)),
        end_date=(
            context.today + timedelta(days=days_until_lease_end)
            if days_until_lease_end is not None
            else None
        ),
    )


def _create_unit_links(context: SeedContext, unit: Unit) -> int:
    """An owner (always) and, sometimes, a tenant. Returns how many links were created."""
    owner = _create_owner_link(context, unit)
    if context.random_generator.random() >= 0.3:
        return 1
    _ = _create_tenant_link(context, unit, owner)
    return 2


def _create_units(
    context: SeedContext, condominium: Condominium, demo: DemoCondominium
) -> tuple[int, int]:
    """Blocks, units and their links. Returns (units created, links created)."""
    random_generator = context.random_generator
    blocks = [
        _create_validated(Block, condominium=condominium, name=block_name)
        for block_name in demo.block_names
    ]
    units_created = links_created = 0
    for number in range(random_generator.randint(5, 8)):
        unit = _create_validated(
            Unit,
            condominium=condominium,
            block=blocks[number % len(blocks)] if blocks else None,
            name=str(UNIT_NUMBERS[number] + (number // 4) * 100),
            **_random_unit_fields(context, demo.kind),
        )
        # `created_at` is auto_now_add: only a queryset update can backdate it (no rule involved).
        _ = Unit.objects.filter(pk=unit.pk).update(
            created_at=_random_past_datetime(random_generator, 170)
        )
        units_created += 1
        has_no_link = unit.active and random_generator.random() < 0.12  # ~12% generate a pending item
        if not has_no_link:
            links_created += _create_unit_links(context, unit)
    return units_created, links_created


def _create_condominium(
    context: SeedContext, position: int, demo: DemoCondominium
) -> tuple[int, int]:
    """One demo condominium with its address, contract, billing rules and units."""
    condominium = _create_validated(
        Condominium,
        company=context.company,
        address=_create_address(context, position, demo),
        name=demo.name,
        cnpj=_generate_cnpj(100 + position),
        type=demo.kind,
        active=demo.active,
    )
    _ = Condominium.objects.filter(pk=condominium.pk).update(
        created_at=_random_past_datetime(context.random_generator, 175)
    )
    _create_administration_contract(context, condominium, demo)
    _ = _create_validated(
        BillingRules,
        condominium=condominium,
        due_day=context.random_generator.choice([5, 10, 15]),
    )
    return _create_units(context, condominium, demo)


def _email_slug(name: str) -> str:
    """ASCII, dot-separated, at most 24 characters: always a valid e-mail local part."""
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    without_suffix = re.sub(r"\b(ltda|s\.a\.)", "", ascii_name)
    words = [word for word in re.split(r"[^a-z0-9]+", without_suffix) if word]
    return ".".join(words)[:24].strip(".")


def _random_person_fields(
    random_generator: random.Random, position: int, name: str
) -> dict[str, Any]:
    has_missing_contact = position % 7 == 3  # some people have no email/cell (pending item)
    return {
        "name": name,
        "cell_number": None if has_missing_contact else _random_phone(random_generator),
        "email": "" if has_missing_contact else f"{_email_slug(name)}@exemplo.com.br",
        "active": position % 11 != 10,
    }


def _create_person(
    company: Company,
    random_generator: random.Random,
    position: int,
    definition: tuple[str, str, str],
) -> Person:
    name, kind, document = definition
    person = _create_validated(
        Person, company=company, **_random_person_fields(random_generator, position, name)
    )
    if kind == "individual":
        _ = _create_validated(
            PeopleIndividual,
            person=person,
            company=company,
            cpf=document,
            marital_status=random_generator.choice(
                ["Solteiro(a)", "Casado(a)", "Divorciado(a)"]
            ),
            job=random_generator.choice(
                ["Engenheiro(a)", "Médico(a)", "Advogado(a)", "Professor(a)", "Empresário(a)"]
            ),
        )
    else:
        _ = _create_validated(PeopleLegal, person=person, company=company, cnpj=document)
    _ = Person.objects.filter(pk=person.pk).update(
        created_at=_random_past_datetime(random_generator, 170)
    )
    return person


def _assign_ideal_fractions(
    random_generator: random.Random, units: list[Unit], target_total: Decimal
) -> None:
    """Random shares for the active units, summing to `target_total` (below 1 shows the pendency)."""
    weights = [random_generator.uniform(0.8, 1.4) for _ in units]
    fractions = [Decimal(f"{weight / sum(weights):.8f}") * target_total for weight in weights]
    if units:
        fractions[-1] += target_total - sum(fractions)  # rounding: close exactly at the target
    for unit, fraction in zip(units, fractions):
        unit.ideal_fraction = fraction.quantize(Decimal("0.00000001"))
        _save_validated(unit)


def _create_demo_condominiums(context: SeedContext) -> tuple[int, int]:
    """Create the demo condominiums that do not exist yet. Returns (units, links) created."""
    units_created = links_created = 0
    for position, demo in enumerate(DEMO_CONDOMINIUMS):
        if Condominium.objects.filter(name=demo.name).exists():
            continue
        new_units, new_links = _create_condominium(context, position, demo)
        units_created += new_units
        links_created += new_links
    return units_created, links_created


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
        demo_names = [demo.name for demo in DEMO_CONDOMINIUMS]
        condominiums = Condominium.objects.filter(name__in=demo_names)
        # Address é OneToOne com SET_NULL: apagar o condomínio deixaria o endereço órfão.
        _ = Address.objects.filter(condominium__in=condominiums).delete()
        condos, _ = condominiums.delete()
        documents = [definition[2] for definition in _demo_person_definitions()]
        persons, _ = Person.objects.filter(
            Q(people_individual__cpf__in=documents) | Q(people_legal__cnpj__in=documents)
        ).delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Removidos: {condos} registros de condomínios (com unidades/vínculos) e {persons} de pessoas."
            )
        )

    def _finalize(self, random_generator: random.Random) -> None:
        """Rateio (frações), centros de custo e bloqueio dos condomínios de exemplo."""
        for demo in DEMO_CONDOMINIUMS:
            condominium = Condominium.objects.filter(name=demo.name).first()
            already_finalized = condominium is not None and condominium.units.filter(
                ideal_fraction__gt=0
            ).exists()
            if condominium is None or already_finalized:
                continue
            target_total = (
                WRONG_APPORTIONMENT_TOTAL if demo.has_wrong_apportionment else Unit.APPORTIONMENT_TOTAL
            )
            _assign_ideal_fractions(
                random_generator, list(condominium.units.filter(active=True)), target_total
            )
            if demo.has_cost_centers:
                for name in COST_CENTERS:
                    if not CostCenter.objects.filter(condominium=condominium, name=name).exists():
                        _ = _create_validated(CostCenter, condominium=condominium, name=name)

        # Um condomínio com uma unidade de cobrança bloqueada.
        blocked_unit = Unit.objects.filter(
            condominium__name=DEMO_CONDOMINIUMS[0].name, active=True
        ).first()
        if blocked_unit:
            blocked_unit.is_billing_blocked = True
            _save_validated(blocked_unit)

    def _create_persons(self, company: Company, random_generator: random.Random) -> list[Person]:
        persons: list[Person] = []
        for position, definition in enumerate(_demo_person_definitions()):
            document = definition[2]
            existing_person = Person.objects.filter(
                Q(people_individual__cpf=document) | Q(people_legal__cnpj=document)
            ).first()
            persons.append(
                existing_person or _create_person(company, random_generator, position, definition)
            )
        return persons

    def _create(self) -> None:
        company = Company.objects.first()
        if company is None:
            _ = self.stderr.write("Nenhuma Company cadastrada; crie uma antes.")
            return

        random_generator = random.Random(42)
        persons = self._create_persons(company, random_generator)
        context = SeedContext(
            random_generator=random_generator,
            company=company,
            active_persons=[person for person in persons if person.active] or persons,
            today=timezone.localdate(),
        )
        units_created, links_created = _create_demo_condominiums(context)
        self._finalize(random_generator)
        self._report(len(persons), units_created, links_created)

    def _report(self, persons_count: int, units_created: int, links_created: int) -> None:
        self.stdout.write(
            self.style.SUCCESS(
                f"Dados de exemplo prontos: {persons_count} pessoas, {len(DEMO_CONDOMINIUMS)} condomínios, "
                f"{units_created} unidades e {links_created} vínculos."
            )
        )
