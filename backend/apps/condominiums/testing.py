"""Helpers for the tests of every app that needs units with fractions."""

from decimal import Decimal

from .models import CondominiumApportionmentCriterion, Condominium, Unit, UnitApportionmentFraction


def criterion_at(condominium: Condominium, position: int = 1) -> CondominiumApportionmentCriterion:
    """The condominium's criterion at `position` (the main one is created with the condominium)."""
    name = CondominiumApportionmentCriterion.MAIN_NAME if position == 1 else f"Fração {position}"
    criterion, _ = CondominiumApportionmentCriterion.objects.get_or_create(
        condominium=condominium, position=position, defaults={"name": name}
    )
    return criterion


def add_fraction(unit: Unit, value: str | int | Decimal, position: int = 1) -> UnitApportionmentFraction:
    """Give `unit` a fraction of `value` in the criterion at `position`."""
    return UnitApportionmentFraction.objects.create(
        unit=unit, criterion=criterion_at(unit.condominium, position), value=Decimal(str(value))
    )
