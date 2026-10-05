from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import models

from apps.condominiums.models import (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.management.commands.seed_demo import _create_validated
from apps.core.models import Company
from apps.finance.models import CostCenter
from apps.persons.models import PeopleIndividual, PeopleLegal, Person

pytestmark = pytest.mark.django_db


def test_seed_creates_data(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    assert Condominium.objects.count() == 8
    assert Unit.objects.exists()
    assert UnitPerson.objects.exists()
    assert Person.objects.count() == 26


def test_seed_is_idempotent(company: Company) -> None:
    call_command("seed_demo", verbosity=0)
    counts = (Condominium.objects.count(), Unit.objects.count(), Person.objects.count())

    call_command("seed_demo", verbosity=0)

    assert (
        Condominium.objects.count(),
        Unit.objects.count(),
        Person.objects.count(),
    ) == counts


def test_clear_removes_everything_it_created(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    call_command("seed_demo", "--clear", verbosity=0)

    assert not Condominium.objects.exists()
    assert not Person.objects.exists()
    assert not Address.objects.exists()


def test_seed_apportionment_sums_to_one_except_deliberate_cases(
    company: Company,
) -> None:
    from django.db.models import Sum

    call_command("seed_demo", verbosity=0)

    wrong = [
        condominium.name
        for condominium in Condominium.objects.filter(active=True)
        if abs((condominium.units.filter(active=True).aggregate(s=Sum("ideal_fraction"))["s"]) - 1)
        > 0.0001
    ]
    assert len(wrong) == 2


def test_seed_without_company_does_nothing() -> None:
    Company.objects.all().delete()  # the core.0002 migration seeds one company

    call_command("seed_demo", verbosity=0)

    assert not Condominium.objects.exists()


SEEDED_MODELS: tuple[type[models.Model], ...] = (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
    CostCenter,
    PeopleIndividual,
    PeopleLegal,
    Person,
    Unit,
    UnitPerson,
)


def test_seed_creates_only_records_the_model_rules_accept(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    for model in SEEDED_MODELS:
        assert model._default_manager.exists(), model.__name__
        for record in model._default_manager.all():
            record.full_clean()


def test_seed_helper_rejects_a_record_that_breaks_a_rule(company: Company) -> None:
    condominium = Condominium.objects.create(
        company=company, name="Teste", cnpj="45723174000110"
    )

    with pytest.raises(ValidationError):
        _ = _create_validated(
            Unit, condominium=condominium, name="101", ideal_fraction=Decimal("2")
        )

    assert not Unit.objects.exists()


def test_seed_assigns_the_company_to_people_and_documents(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    assert not Person.objects.exclude(company=company).exists()
    assert not PeopleIndividual.objects.exclude(company=company).exists()
    assert not PeopleLegal.objects.exclude(company=company).exists()
