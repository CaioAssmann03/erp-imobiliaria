"""The finance admins (spec 009, R7)."""

import pytest
from auditlog.models import LogEntry
from django.contrib import admin
from django.test import RequestFactory

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.management.commands.seed_demo import _generate_cnpj
from apps.core.models import Company

from ..admin import EntryTemplateInline
from ..models import AccountPayable, BankAccount, CostCenter, EntryTemplate, Supplier

pytestmark = pytest.mark.django_db


def request_as(user: User):  # type: ignore[no-untyped-def]
    request = RequestFactory().get("/admin/")
    request.user = user
    return request


@pytest.fixture
def staff(company: Company) -> User:
    return User.objects.create_user("staff", password="x", company=company, is_staff=True)


def test_admins_are_company_scoped(
    staff: User, cost_center: CostCenter, other_company: Company
) -> None:
    their_condominium = Condominium.objects.create(
        company=other_company, name="Alheio", cnpj=_generate_cnpj(7)
    )
    their_cost_center = CostCenter.objects.create(condominium=their_condominium, name="Alheio")
    _ = EntryTemplate.objects.create(cost_center=their_cost_center, name="Alheio")
    _ = EntryTemplate.objects.create(cost_center=cost_center, name="Meu")

    cost_centers = admin.site._registry[CostCenter].get_queryset(request_as(staff))
    templates = admin.site._registry[EntryTemplate].get_queryset(request_as(staff))

    assert set(cost_centers.values_list("pk", flat=True)) == {cost_center.pk}
    assert [template.name for template in templates] == ["Meu"]


def test_cost_center_admin_lists_templates_inline() -> None:
    assert EntryTemplateInline in admin.site._registry[CostCenter].inlines


def test_models_are_audited(cost_center: CostCenter) -> None:
    template = EntryTemplate.objects.create(cost_center=cost_center, name="PG. DMAE")

    assert LogEntry.objects.get_for_object(cost_center).count() == 1
    assert LogEntry.objects.get_for_object(template).count() == 1


def test_new_admins_are_company_scoped(staff: User, company: Company, other_company: Company) -> None:
    from apps.persons.models import Person

    mine = BankAccount.objects.create(company=company, bank_code="033", branch="1", account_number="1")
    _ = BankAccount.objects.create(company=other_company, bank_code="033", branch="1", account_number="1")
    my_supplier = Supplier.objects.create(person=Person.objects.create(company=company, name="Minha"))
    _ = Supplier.objects.create(person=Person.objects.create(company=other_company, name="Alheia"))

    accounts = admin.site._registry[BankAccount].get_queryset(request_as(staff))
    suppliers = admin.site._registry[Supplier].get_queryset(request_as(staff))

    assert list(accounts) == [mine]
    assert list(suppliers) == [my_supplier]


def test_account_payable_admin_is_company_scoped(staff: User, make_account, company: Company, other_company: Company) -> None:  # type: ignore[no-untyped-def]
    from apps.persons.models import Person

    mine = make_account()
    their_supplier = Supplier.objects.create(person=Person.objects.create(company=other_company, name="Alheia"))
    _ = AccountPayable.objects.create(
        company=other_company, supplier=their_supplier, description="Alheia", amount="1.00", due_date="2026-10-20"
    )

    accounts = admin.site._registry[AccountPayable].get_queryset(request_as(staff))

    assert list(accounts) == [mine]
    assert {"status", "payment_date", "amount_paid", "payment_method"} <= set(
        admin.site._registry[AccountPayable].readonly_fields
    )
