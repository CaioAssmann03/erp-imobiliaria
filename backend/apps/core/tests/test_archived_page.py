"""Spec 063, R3–R5: the Arquivados page of the Admin lists the deleted records and restores them."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.contrib.messages import get_messages
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.condominiums.models import Block, Condominium
from apps.core.models import Company
from apps.persons.models import Person

pytestmark = pytest.mark.django_db

URL = "admin_archived"


@pytest.fixture
def superuser(company: Company) -> User:
    return User.objects.create_superuser("root", password="x", company=company)


@pytest.fixture
def client_of_a_superuser(client, superuser: User):  # type: ignore[no-untyped-def]
    client.force_login(superuser)
    return client


def make_condominium(company: Company, name: str = "Sol", cnpj: str = "11222333000181") -> Condominium:
    return Condominium.objects.create(company=company, name=name, cnpj=cnpj, active=False)


def messages_of(response) -> list[str]:  # type: ignore[no-untyped-def]
    return [str(message) for message in get_messages(response.wsgi_request)]


def test_the_page_lists_the_deleted_records_of_the_company(client_of_a_superuser, company: Company) -> None:  # type: ignore[no-untyped-def]
    gone = make_condominium(company, "Residencial Sol")
    _ = make_condominium(company, "Edifício Lua", "45723174000110")
    _ = gone.delete()

    response = client_of_a_superuser.get(reverse(URL) + "?type=condominiums.condominium")

    assert response.status_code == 200
    html = response.content.decode()
    assert "Residencial Sol" in html
    assert "Edifício Lua" not in html
    assert "Restaurar" in html


def staff_with_permission(company: Company, codename: str) -> User:
    staff = User.objects.create_user("staff", password="x", company=company, is_staff=True)
    staff.user_permissions.add(Permission.objects.get(codename=codename))
    return staff


def test_the_page_follows_the_company_of_a_staff_user(client, company: Company, other_company: Company) -> None:  # type: ignore[no-untyped-def]
    client.force_login(staff_with_permission(company, "change_condominium"))
    ours = make_condominium(company, "Nosso")
    theirs = make_condominium(other_company, "Deles", "45723174000110")
    _ = ours.delete()
    _ = theirs.delete()

    html = client.get(reverse(URL) + "?type=condominiums.condominium").content.decode()

    assert "Nosso" in html
    assert "Deles" not in html


def test_a_user_without_the_change_permission_gets_no_tab(client, company: Company) -> None:  # type: ignore[no-untyped-def]
    client.force_login(User.objects.create_user("staff", password="x", company=company, is_staff=True))

    html = client.get(reverse(URL)).content.decode()

    assert "não tem permissão" in html


def test_restore_brings_a_record_back(client_of_a_superuser, company: Company) -> None:  # type: ignore[no-untyped-def]
    condominium = make_condominium(company)
    _ = condominium.delete()

    response = client_of_a_superuser.post(
        reverse(URL), {"action": "restore", "model": "condominiums.condominium", "pk": str(condominium.pk)}
    )

    assert response.status_code == 302
    assert Condominium.objects.filter(pk=condominium.pk).exists()


def test_a_refused_restore_is_a_message(client_of_a_superuser, company: Company) -> None:  # type: ignore[no-untyped-def]
    condominium = make_condominium(company)
    first = Block.objects.create(condominium=condominium, name="Bloco A")
    _ = first.delete()
    _ = Block.objects.create(condominium=condominium, name="Bloco A")

    response = client_of_a_superuser.post(
        reverse(URL), {"action": "restore", "model": "condominiums.block", "pk": str(first.pk)}, follow=True
    )

    assert Block.all_objects.get(pk=first.pk).is_archived
    assert any("Bloco A" in message for message in messages_of(response))


def test_anonymize_is_for_superusers_only(client, company: Company) -> None:  # type: ignore[no-untyped-def]
    person = Person.objects.create(company=company, name="Maria")
    _ = person.delete()
    Person.all_objects.filter(pk=person.pk).update(deleted_at=timezone.now() - timedelta(days=365 * 6))
    data = {"action": "anonymize", "model": "persons.person", "pk": str(person.pk)}

    client.force_login(staff_with_permission(company, "change_person"))
    _ = client.post(reverse(URL), data)
    assert Person.all_objects.get(pk=person.pk).anonymized_at is None

    client.force_login(User.objects.create_superuser("root", password="x", company=company))
    _ = client.post(reverse(URL), data)
    assert Person.all_objects.get(pk=person.pk).anonymized_at is not None


def test_anonymize_inside_the_retention_period_is_a_message(client_of_a_superuser, company: Company) -> None:  # type: ignore[no-untyped-def]
    person = Person.objects.create(company=company, name="Maria")
    _ = person.delete()

    response = client_of_a_superuser.post(
        reverse(URL), {"action": "anonymize", "model": "persons.person", "pk": str(person.pk)}, follow=True
    )

    assert Person.all_objects.get(pk=person.pk).anonymized_at is None
    assert any("legais" in message or "legal" in message for message in messages_of(response))
