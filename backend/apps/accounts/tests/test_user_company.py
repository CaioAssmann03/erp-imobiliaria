"""Every user belongs to a company (spec 004, R1)."""

import pytest
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import RequestFactory

from apps.accounts.admin import UserAdmin
from apps.accounts.models import User
from apps.core.models import Company
from apps.core.testing import seeded_company

pytestmark = pytest.mark.django_db


def test_user_requires_company() -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = User.objects.create(username="orphan")


def test_user_company_is_not_nullable() -> None:
    assert User._meta.get_field("company").null is False


def test_create_user_uses_the_only_company() -> None:
    user = User.objects.create_user("maria", password="x")

    assert user.company == seeded_company()


def test_create_superuser_uses_seeded_company() -> None:
    admin = User.objects.create_superuser("root", password="x")

    assert admin.company == seeded_company()
    assert admin.is_superuser


def test_with_several_companies_the_company_must_be_given(other_company: Company) -> None:
    with pytest.raises(ValueError, match="Several companies"):
        _ = User.objects.create_superuser("root", password="x")


def test_company_can_be_passed_explicitly(other_company: Company) -> None:
    user = User.objects.create_user("maria", password="x", company=other_company)

    assert user.company == other_company


def test_superuser_company_comes_from_the_environment_by_id(
    other_company: Company, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("DJANGO_SUPERUSER_COMPANY", str(other_company.pk))

    admin = User.objects.create_superuser("root", password="x")

    assert admin.company == other_company


def test_superuser_company_comes_from_the_environment_by_cnpj(
    other_company: Company, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("DJANGO_SUPERUSER_COMPANY", other_company.cnpj)

    admin = User.objects.create_superuser("root", password="x")

    assert admin.company == other_company


def test_the_admin_forms_show_the_company() -> None:
    in_fieldsets = any("company" in options["fields"] for _, options in UserAdmin.fieldsets or ())
    in_add_fieldsets = any(
        "company" in options["fields"] for _, options in UserAdmin.add_fieldsets or ()
    )

    assert in_fieldsets
    assert in_add_fieldsets


def test_a_user_cannot_change_company(other_company: Company) -> None:
    user = User.objects.create_user("maria", password="x", company=seeded_company())
    user.company = other_company

    with pytest.raises(ValidationError) as error:
        user.full_clean(exclude=("password",))

    assert error.value.error_dict["company"][0].code == "user.company.immutable"


def test_saving_a_user_again_in_the_same_company_is_fine() -> None:
    user = User.objects.create_user("maria", password="x")
    user.first_name = "Maria"

    user.full_clean(exclude=("password",))
    user.save()


def test_the_admin_shows_the_company_read_only_on_an_existing_user() -> None:
    user = User.objects.create_user("maria", password="x")
    model_admin = UserAdmin(User, admin_site=admin.site)
    request = RequestFactory().get("/")

    assert "company" in model_admin.get_readonly_fields(request, user)
    assert "company" not in model_admin.get_readonly_fields(request, None)
