"""A small set of records that belong to one company, for the isolation tests (spec 004)."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from apps.condominiums.models import Block, Condominium, Unit, UnitPerson
from apps.core.management.commands.seed_demo import _generate_cnpj, _generate_cpf
from apps.core.models import Company
from apps.persons.models import PeopleIndividual, Person


@dataclass(frozen=True)
class CompanyData:
    company: Company
    person: Person
    condominium: Condominium
    block: Block
    unit: Unit
    unit_person: UnitPerson


def build_company_data(company: Company, seed: int) -> CompanyData:
    """Distinct documents per `seed`, so two companies can both have data."""
    person = Person.objects.create(company=company, name=f"Pessoa {seed}")
    _ = PeopleIndividual.objects.create(person=person, company=company, cpf=_generate_cpf(seed))
    condominium = Condominium.objects.create(
        company=company, name=f"Condominio {seed}", cnpj=_generate_cnpj(seed)
    )
    block = Block.objects.create(condominium=condominium, name=f"Bloco {seed}")
    unit = Unit.objects.create(condominium=condominium, block=block, name=f"{seed}01")
    unit_person = UnitPerson.objects.create(
        unit=unit,
        person=person,
        role=UnitPerson.Role.OWNER,
        ownership_percentage=Decimal("100"),
        start_date=date(2024, 1, 1),
    )
    return CompanyData(company, person, condominium, block, unit, unit_person)
