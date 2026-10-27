
import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import models

from apps.billing.models import CondominiumBillingRules
from apps.condominiums.models import (
    UnitApportionmentFraction,
    AdministrationContract,
    Block,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.seed.validated import create_validated
from apps.core.models import Address, Company
from apps.finance.models import (
    AccountPayable,
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
    Supplier,
)
from apps.finance.services.settle_account_payable import (
    AccountPayablePayment,
    settle_account_payable,
)
from apps.persons.models import PeopleIndividual, PeopleLegal, Person

pytestmark = pytest.mark.django_db


def test_seed_creates_data(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    assert Condominium.objects.count() == 8
    assert Unit.objects.exists()
    assert UnitPerson.objects.exists()
    assert Person.objects.count() == 30  # 26 owners and tenants + 4 suppliers


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
        if abs((UnitApportionmentFraction.objects.filter(unit__condominium=condominium, unit__active=True, criterion__position=1).aggregate(s=Sum("value"))["s"]) - 1)
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
    CondominiumBillingRules,
    Block,
    Condominium,
    CostCenter,
    PeopleIndividual,
    PeopleLegal,
    Person,
    Unit,
    UnitPerson,
    Supplier,
    EntryTemplate,
    AccountPayable,
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
        _ = create_validated(
            Unit, condominium=condominium, name="101", resident_count=-1
        )

    assert not Unit.objects.exists()


def test_seed_assigns_the_company_to_people_and_documents(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    assert not Person.objects.exclude(company=company).exists()
    assert not PeopleIndividual.objects.exclude(company=company).exists()
    assert not PeopleLegal.objects.exclude(company=company).exists()


def test_seed_creates_open_accounts_payable_ready_to_be_paid(company: Company) -> None:
    call_command("seed_demo", verbosity=0)

    assert Supplier.objects.count() == 4
    assert AccountPayable.objects.filter(status="open").count() == 5
    assert AccountPayable.objects.filter(condominium__isnull=True).count() == 1
    condominium_expenses = AccountPayable.objects.filter(condominium__isnull=False)
    assert not condominium_expenses.filter(entry_template__isnull=True).exists()
    assert not CurrentAccountEntry.objects.exists()  # nothing is paid by the seed


def test_seed_finance_is_idempotent(company: Company) -> None:
    call_command("seed_demo", verbosity=0)
    counts = (Supplier.objects.count(), EntryTemplate.objects.count(), AccountPayable.objects.count())

    call_command("seed_demo", verbosity=0)

    assert (Supplier.objects.count(), EntryTemplate.objects.count(), AccountPayable.objects.count()) == counts


def test_clear_removes_the_finance_data_even_after_payments_and_reversals(company: Company, staff_user) -> None:  # type: ignore[no-untyped-def]
    import datetime

    from apps.finance.services.reverse_entry import reverse_entry

    call_command("seed_demo", verbosity=0)
    account = AccountPayable.objects.filter(condominium__isnull=False).first()
    assert account is not None
    settle_account_payable(account, AccountPayablePayment(datetime.date(2026, 10, 6), account.amount, "pix", staff_user))
    reverse_entry(CurrentAccountEntry.objects.get(), "Teste", datetime.date(2026, 10, 7), staff_user)

    call_command("seed_demo", "--clear", verbosity=0)

    for model in (AccountPayable, Supplier, EntryTemplate, CurrentAccount, CurrentAccountEntry, EntryBatch, Person, Condominium):
        assert not model._default_manager.exists(), model.__name__
