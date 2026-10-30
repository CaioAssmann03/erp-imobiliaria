"""Spec 062, R10: the Admin lists deleted records (filter `deleted`), restores them and turns a refused deletion into a message."""

from typing import Any

import pytest
from django.contrib import admin
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from apps.accounts.models import User
from apps.core.infrastructure.soft_delete_admin import ArchivedListFilter
from apps.core.models import Company
from apps.persons.models import Person

pytestmark = pytest.mark.django_db


@pytest.fixture
def request_of_a_superuser(company: Company):  # type: ignore[no-untyped-def]
    request = RequestFactory().get("/admin/persons/person/")
    request.user = User.objects.create_superuser("root", password="x", company=company)
    request.session = {}  # type: ignore[assignment]
    request._messages = FallbackStorage(request)  # type: ignore[attr-defined]
    return request


def person_admin() -> Any:
    return admin.site._registry[Person]


def test_the_admin_queryset_includes_deleted_records(company: Company, request_of_a_superuser) -> None:  # type: ignore[no-untyped-def]
    live = Person.objects.create(company=company, name="Maria")
    gone = Person.objects.create(company=company, name="João")
    _ = gone.delete()

    names = set(person_admin().get_queryset(request_of_a_superuser).values_list("name", flat=True))

    assert names == {live.name, gone.name}


def test_the_filter_hides_deleted_records_by_default_and_shows_them_on_request(company: Company, request_of_a_superuser) -> None:  # type: ignore[no-untyped-def]
    _ = Person.objects.create(company=company, name="Maria")
    gone = Person.objects.create(company=company, name="João")
    _ = gone.delete()
    queryset = person_admin().get_queryset(request_of_a_superuser)

    def filtered(value: str | None):  # type: ignore[no-untyped-def]
        params = {} if value is None else {ArchivedListFilter.parameter_name: [value]}
        return set(ArchivedListFilter(request_of_a_superuser, params, Person, person_admin()).queryset(request_of_a_superuser, queryset).values_list("name", flat=True))

    assert filtered(None) == {"Maria"}
    assert filtered("yes") == {"João"}
    assert filtered("all") == {"Maria", "João"}


def test_the_restore_action_brings_deleted_records_back(company: Company, request_of_a_superuser) -> None:  # type: ignore[no-untyped-def]
    gone = Person.objects.create(company=company, name="João")
    _ = gone.delete()

    person_admin().restore_selected(request_of_a_superuser, Person.all_objects.filter(pk=gone.pk))

    assert Person.objects.filter(pk=gone.pk).exists()


def test_a_refused_deletion_in_the_admin_is_a_message_not_an_error(company: Company, request_of_a_superuser) -> None:  # type: ignore[no-untyped-def]
    from apps.condominiums.models import Condominium

    condominium = Condominium.objects.create(company=company, name="Sol", cnpj="11222333000181", active=True)

    admin.site._registry[Condominium].delete_model(request_of_a_superuser, condominium)

    assert Condominium.objects.filter(pk=condominium.pk).exists()
