"""Demo condominiums: address, contract, billing rules, blocks, units, links and apportionment."""

import random
from datetime import timedelta
from decimal import Decimal
from typing import Any

from dateutil.relativedelta import relativedelta

from apps.condominiums.models import (
    AdministrationContract,
    CondominiumApportionmentCriterion,
    Block,
    Condominium,
    Unit,
    UnitApportionmentFraction,
    UnitPerson,
)
from apps.billing.models import CondominiumBillingRules
from apps.core.models import Address
from apps.finance.models import (
    CostCenter,
)

from .context import SeedContext
from .demo_data import (
    COST_CENTERS,
    DAYS_UNTIL_LEASE_END,
    DEMO_CONDOMINIUMS,
    DISTRICTS,
    STREETS,
    UNIT_NUMBERS,
    UNIT_TYPES,
    DemoCondominium,
)
from .documents import generate_cnpj
from .fakes import random_past_datetime
from .validated import create_validated, save_validated

WRONG_APPORTIONMENT_TOTAL = Decimal(
    "0.9"
)  # fractions that do not close at 1 (shows the pendency)


def random_utility_value(
    random_generator: random.Random, maximum: int, probability: float
) -> Decimal:
    if random_generator.random() < probability:
        return Decimal(f"{random_generator.uniform(0, maximum):.2f}")
    return Decimal("0")


def random_unit_fields(context: SeedContext, condominium_kind: str) -> dict[str, Any]:
    random_generator = context.random_generator
    is_residential = condominium_kind == "residential"
    return {
        "type": random_generator.choice(UNIT_TYPES[condominium_kind]),
        "resident_count": random_generator.randint(0, 5) if is_residential else 0,
        "gas_value": random_utility_value(random_generator, 60, 0.4),
        "water_value": random_utility_value(random_generator, 90, 0.5),
        "active": random_generator.random() > 0.08,
    }


def create_address(
    context: SeedContext, position: int, demo: DemoCondominium
) -> Address | None:
    if not demo.has_address:
        return None
    return create_validated(
        Address,
        company=context.company,
        zip_code=demo.zip_code.replace("-", "") or None,
        street=STREETS[position % len(STREETS)],
        number=str(context.random_generator.randint(100, 2500)),
        district=DISTRICTS[position % len(DISTRICTS)],
        city=demo.city,
        state=demo.state,
    )


def create_administration_contract(
    context: SeedContext, condominium: Condominium, demo: DemoCondominium
) -> None:
    days_until_adjustment = demo.days_until_adjustment
    is_fixed = demo.fee_type == "fixed"
    adjustment_base_date = (
        context.today + timedelta(days=days_until_adjustment) - relativedelta(months=12)
        if days_until_adjustment is not None
        else None
    )
    _ = create_validated(
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


def create_owner_link(context: SeedContext, unit: Unit) -> UnitPerson:
    random_generator = context.random_generator
    return create_validated(
        UnitPerson,
        unit=unit,
        person=random_generator.choice(context.active_persons),
        role=UnitPerson.Role.OWNER,
        ownership_percentage=Decimal("100"),
        start_date=context.today - timedelta(days=random_generator.randint(700, 2000)),
    )


def create_tenant_link(
    context: SeedContext, unit: Unit, owner: UnitPerson
) -> UnitPerson:
    random_generator = context.random_generator
    tenant = random_generator.choice(
        [person for person in context.active_persons if person.pk != owner.person_id]
    )
    days_until_lease_end = random_generator.choice(DAYS_UNTIL_LEASE_END)
    return create_validated(
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


def create_unit_links(context: SeedContext, unit: Unit) -> int:
    """An owner (always) and, sometimes, a tenant. Returns how many links were created."""
    owner = create_owner_link(context, unit)
    if context.random_generator.random() >= 0.3:
        return 1
    _ = create_tenant_link(context, unit, owner)
    return 2


def create_units(
    context: SeedContext, condominium: Condominium, demo: DemoCondominium
) -> tuple[int, int]:
    """Blocks, units and their links. Returns (units created, links created)."""
    random_generator = context.random_generator
    blocks = [
        create_validated(Block, condominium=condominium, name=block_name)
        for block_name in demo.block_names
    ]
    units_created = links_created = 0
    for number in range(random_generator.randint(5, 8)):
        unit = create_validated(
            Unit,
            condominium=condominium,
            block=blocks[number % len(blocks)] if blocks else None,
            name=str(UNIT_NUMBERS[number] + (number // 4) * 100),
            **random_unit_fields(context, demo.kind),
        )
        # `created_at` is auto_now_add: only a queryset update can backdate it (no rule involved).
        _ = Unit.objects.filter(pk=unit.pk).update(
            created_at=random_past_datetime(random_generator, 170)
        )
        units_created += 1
        has_no_link = (
            unit.active and random_generator.random() < 0.12
        )  # ~12% generate a pending item
        if not has_no_link:
            links_created += create_unit_links(context, unit)
    return units_created, links_created


def create_condominium(
    context: SeedContext, position: int, demo: DemoCondominium
) -> tuple[int, int]:
    condominium = create_validated(
        Condominium,
        company=context.company,
        address=create_address(context, position, demo),
        name=demo.name,
        cnpj=generate_cnpj(100 + position),
        type=demo.kind,
        active=demo.active,
    )
    _ = Condominium.objects.filter(pk=condominium.pk).update(
        created_at=random_past_datetime(context.random_generator, 175)
    )
    create_administration_contract(context, condominium, demo)
    _ = create_validated(
        CondominiumBillingRules,
        condominium=condominium,
        due_day=context.random_generator.choice([5, 10, 15]),
    )
    return create_units(context, condominium, demo)


def assign_ideal_fractions(
    random_generator: random.Random,
    criterion: CondominiumApportionmentCriterion,
    units: list[Unit],
    target_total: Decimal,
) -> None:
    """Random shares of `criterion` for the active units, summing to `target_total` (below 1 shows the pendency)."""
    weights = [random_generator.uniform(0.8, 1.4) for _ in units]
    fractions = [
        Decimal(f"{weight / sum(weights):.8f}") * target_total for weight in weights
    ]
    if units:
        fractions[-1] += target_total - sum(
            fractions
        )  # rounding: close exactly at the target
    for unit, fraction in zip(units, fractions):
        _ = create_validated(
            UnitApportionmentFraction,
            unit=unit,
            criterion=criterion,
            value=fraction.quantize(Decimal("0.00000001")),
        )


def create_demo_condominiums(context: SeedContext) -> tuple[int, int]:
    """Create the demo condominiums that do not exist yet. Returns (units, links) created."""
    units_created = links_created = 0
    for position, demo in enumerate(DEMO_CONDOMINIUMS):
        if Condominium.objects.filter(name=demo.name).exists():
            continue
        new_units, new_links = create_condominium(context, position, demo)
        units_created += new_units
        links_created += new_links
    return units_created, links_created


def finalize_demo_condominiums(random_generator: random.Random) -> None:
    """Rateio (frações), centros de custo e bloqueio dos condomínios de exemplo."""
    for demo in DEMO_CONDOMINIUMS:
        condominium = Condominium.objects.filter(name=demo.name).first()
        already_finalized = (
            condominium is not None
            and UnitApportionmentFraction.objects.filter(unit__condominium=condominium).exists()
        )
        if condominium is None or already_finalized:
            continue
        target_total = (
            WRONG_APPORTIONMENT_TOTAL
            if demo.has_wrong_apportionment
            else CondominiumApportionmentCriterion.TOTAL
        )
        main_criterion = condominium.apportionment_criteria.get(
            position=CondominiumApportionmentCriterion.MAIN_POSITION
        )
        assign_ideal_fractions(
            random_generator,
            main_criterion,
            list(condominium.units.filter(active=True)),
            target_total,
        )
        if demo.has_cost_centers:
            for name in COST_CENTERS:
                if not CostCenter.objects.filter(
                    condominium=condominium, name=name
                ).exists():
                    _ = create_validated(CostCenter, condominium=condominium, name=name)

    # Um condomínio com uma unidade de cobrança bloqueada.
    blocked_unit = Unit.objects.filter(
        condominium__name=DEMO_CONDOMINIUMS[0].name, active=True
    ).first()
    if blocked_unit:
        blocked_unit.is_billing_blocked = True
        save_validated(blocked_unit)
