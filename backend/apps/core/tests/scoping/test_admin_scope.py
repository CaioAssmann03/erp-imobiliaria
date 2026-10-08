"""The Django Admin follows the company scope (spec 004, R10)."""

import pytest
from django.contrib import admin
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.persons.models import Person

from ..scoping_data import build_company_data

pytestmark = pytest.mark.django_db


def request_as(user: User | AnonymousUser):  # type: ignore[no-untyped-def]
    request = RequestFactory().get("/admin/")
    request.user = user
    return request


@pytest.fixture
def staff(company: Company) -> User:
    return User.objects.create_user("staff", password="x", company=company, is_staff=True)


@pytest.fixture
def two_companies(company: Company, other_company: Company):  # type: ignore[no-untyped-def]
    return build_company_data(company, seed=1), build_company_data(other_company, seed=2)


def test_staff_admin_lists_only_own_company(staff: User, two_companies) -> None:  # type: ignore[no-untyped-def]
    mine, theirs = two_companies
    model_admin = admin.site._registry[Person]

    queryset = model_admin.get_queryset(request_as(staff))

    assert set(queryset.values_list("pk", flat=True)) == {mine.person.pk}


def test_superuser_admin_lists_every_company(two_companies, company: Company) -> None:  # type: ignore[no-untyped-def]
    superuser = User.objects.create_superuser("root", password="x", company=company)
    model_admin = admin.site._registry[Person]

    queryset = model_admin.get_queryset(request_as(superuser))

    assert queryset.count() == 2


def test_fk_choices_are_scoped(staff: User, two_companies) -> None:  # type: ignore[no-untyped-def]
    mine, theirs = two_companies
    model_admin = admin.site._registry[Condominium]
    advisor_field = Condominium._meta.get_field("advisor")

    form_field = model_admin.formfield_for_foreignkey(advisor_field, request_as(staff))

    assert form_field is not None and form_field.queryset is not None
    assert set(form_field.queryset.values_list("pk", flat=True)) == {mine.person.pk}


def test_company_choice_is_the_users_company_for_staff(
    staff: User, company: Company, other_company: Company
) -> None:
    model_admin = admin.site._registry[Condominium]
    company_field = Condominium._meta.get_field("company")

    form_field = model_admin.formfield_for_foreignkey(company_field, request_as(staff))

    assert form_field is not None and form_field.queryset is not None
    assert list(form_field.queryset) == [company]
    assert form_field.initial == company.pk


def test_company_admin_lists_only_own_company(
    staff: User, company: Company, other_company: Company
) -> None:
    model_admin = admin.site._registry[Company]

    assert list(model_admin.get_queryset(request_as(staff))) == [company]
