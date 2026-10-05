import pytest
from django.core.management import call_command

from apps.condominiums.models import Address, Condominium, Unit, UnitPerson
from apps.core.models import Company
from apps.persons.models import Person

pytestmark = pytest.mark.django_db


@pytest.fixture
def company() -> Company:
    return Company.objects.create(legal_name="Adm", cnpj="00000000000191")


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
