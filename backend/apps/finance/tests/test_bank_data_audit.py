"""Bank data is masked in the audit log (spec 010, R8)."""

import pytest
from auditlog.models import LogEntry

from apps.core.audit import MASKED_VALUE
from apps.core.models import Company
from apps.persons.models import Person

from ..models import BankAccount, Supplier

pytestmark = pytest.mark.django_db

SECRETS = ("9876543-2", "chave-pix-secreta@exemplo.com", "4321")


def all_changes_text() -> str:
    return " ".join(str(entry.changes) for entry in LogEntry.objects.all())


def test_bank_data_is_masked_in_the_log(company: Company) -> None:
    account = BankAccount.objects.create(
        company=company, bank_code="033", branch="4321", account_number="9876543-2", pix_key="chave-pix-secreta@exemplo.com"
    )
    account.account_number = "1111111-1"
    account.save()

    update = LogEntry.objects.get_for_object(account).latest("timestamp")

    assert update.changes["account_number"] == [MASKED_VALUE, MASKED_VALUE]
    created = LogEntry.objects.get_for_object(account).earliest("timestamp")
    assert created.changes["bank_code"] == ["None", "033"]  # a public bank code is not secret


def test_no_real_bank_value_appears_in_any_entry(company: Company) -> None:
    person = Person.objects.create(company=company, name="Companhia")
    _ = BankAccount.objects.create(
        company=company, bank_code="033", branch="4321", account_number="9876543-2", pix_key="chave-pix-secreta@exemplo.com"
    )
    supplier = Supplier.objects.create(
        person=person, bank_code="341", branch="4321", account_number="9876543-2", pix_key="chave-pix-secreta@exemplo.com"
    )
    supplier.pix_key = "nova-chave-secreta@exemplo.com"
    supplier.save()

    text = all_changes_text()

    for secret in (*SECRETS[:3], "nova-chave-secreta@exemplo.com"):
        assert secret not in text
    assert "341" not in text  # the supplier's bank code is masked too
