"""Current account (roadmap phase 3 part 04, no spec yet): one per condominium, same company, fixed condominium."""

from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.condominiums.models import Condominium
from apps.seed.documents import generate_cnpj
from apps.core.models import Company

from ..models import CurrentAccount
from ..services.post_entry import post_entry

pytestmark = pytest.mark.django_db


def test_balance_starts_at_zero(company: Company, condominium: Condominium) -> None:
    account = CurrentAccount.objects.create(company=company, condominium=condominium)

    assert account.balance == 0


def test_a_condominium_has_one_current_account_only(company: Company, condominium: Condominium) -> None:
    _ = CurrentAccount.objects.create(company=company, condominium=condominium)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CurrentAccount.objects.create(company=company, condominium=condominium)


def test_a_second_account_is_refused_by_the_model_rules_with_its_code(
    company: Company, condominium: Condominium
) -> None:
    _ = CurrentAccount.objects.create(company=company, condominium=condominium)

    with pytest.raises(ValidationError) as error:
        CurrentAccount(company=company, condominium=condominium).full_clean()

    assert error.value.error_dict["__all__"][0].code == "current_account.condominium.duplicate"


def test_condominium_of_another_company_is_rejected(company: Company, other_company: Company) -> None:
    theirs = Condominium.objects.create(company=other_company, name="Alheio", cnpj=generate_cnpj(9))
    account = CurrentAccount(company=company, condominium=theirs)

    with pytest.raises(ValidationError) as error:
        account.clean()

    assert error.value.error_dict["condominium"][0].code == "current_account.condominium.other_company"


def test_condominium_of_the_same_company_is_accepted(company: Company, condominium: Condominium) -> None:
    CurrentAccount(company=company, condominium=condominium).clean()


def test_condominium_cannot_change_after_creation(
    company: Company, condominium: Condominium, other_condominium: Condominium
) -> None:
    account = CurrentAccount.objects.create(company=company, condominium=condominium)
    account.condominium = other_condominium

    with pytest.raises(ValidationError) as error:
        account.clean()

    assert error.value.error_dict["condominium"][0].code == "current_account.condominium.immutable"


def test_saving_the_same_condominium_again_is_accepted(company: Company, condominium: Condominium) -> None:
    account = CurrentAccount.objects.create(company=company, condominium=condominium)

    account.clean()


def test_recalculated_balance_of_an_account_without_entries_is_zero(
    current_account: CurrentAccount,
) -> None:
    assert current_account.recalculated_balance() == Decimal(0)


def test_recalculated_balance_adds_credits_and_subtracts_debits(
    current_account: CurrentAccount, make_entry: Any
) -> None:
    for kind, amount in (("credit", "500.00"), ("debit", "100.00"), ("debit", "50.00")):
        post_entry(make_entry(kind=kind, amount=Decimal(amount)))

    assert current_account.recalculated_balance() == Decimal("350.00")
