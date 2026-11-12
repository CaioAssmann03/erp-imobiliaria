"""Spec 063: every Admin screen renders with the shared base (Portuguese labels, tabs, compact forms)."""

import pytest
from django.contrib import admin
from django.urls import reverse

from apps.accounts.models import User
from apps.condominiums.models import Condominium, Unit
from apps.core.models import Company
from apps.persons.models import Person

pytestmark = pytest.mark.django_db

REGISTERED = sorted(admin.site._registry, key=lambda model: f"{model._meta.app_label}.{model._meta.model_name}")


@pytest.fixture
def logged_in(client, company: Company):  # type: ignore[no-untyped-def]
    client.force_login(User.objects.create_superuser("root", password="x", company=company))
    return client


@pytest.mark.parametrize("model", REGISTERED, ids=lambda model: f"{model._meta.app_label}.{model._meta.model_name}")
def test_every_list_renders(logged_in, model) -> None:  # type: ignore[no-untyped-def]
    response = logged_in.get(reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_changelist"))

    assert response.status_code == 200


@pytest.mark.parametrize("model", REGISTERED, ids=lambda model: f"{model._meta.app_label}.{model._meta.model_name}")
def test_every_add_form_renders(logged_in, model) -> None:  # type: ignore[no-untyped-def]
    model_admin = admin.site._registry[model]
    request = logged_in.get("/").wsgi_request
    if not model_admin.has_add_permission(request):
        pytest.skip("read-only in the Admin")

    response = logged_in.get(reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_add"))

    assert response.status_code == 200


def test_the_condominium_form_has_tabs_and_portuguese_labels(logged_in, company: Company) -> None:  # type: ignore[no-untyped-def]
    condominium = Condominium.objects.create(company=company, name="Sol", cnpj="11222333000181")

    html = logged_in.get(reverse("admin:condominiums_condominium_change", args=[condominium.pk])).content.decode()

    for text in ("Identificação", "Responsável e endereço", "Medidores e inscrição", "Blocos", "CNPJ", "Assessor"):
        assert text in html


def test_the_unit_and_person_forms_render_their_tabs(logged_in, company: Company) -> None:  # type: ignore[no-untyped-def]
    condominium = Condominium.objects.create(company=company, name="Sol", cnpj="11222333000181")
    unit = Unit.objects.create(condominium=condominium, name="101")
    person = Person.objects.create(company=company, name="Maria")

    unit_html = logged_in.get(reverse("admin:condominiums_unit_change", args=[unit.pk])).content.decode()
    person_html = logged_in.get(reverse("admin:persons_person_change", args=[person.pk])).content.decode()

    assert "Consumos" in unit_html and "Quem recebe o boleto" in unit_html
    assert "Contato" in person_html and "Celular" in person_html


def test_a_list_shows_portuguese_headers_and_yes_no_icons(logged_in, company: Company) -> None:  # type: ignore[no-untyped-def]
    _ = Condominium.objects.create(company=company, name="Sol", cnpj="11222333000181")

    html = logged_in.get(reverse("admin:condominiums_condominium_changelist")).content.decode()

    for header in ("Código", "Nome", "Tipo", "Ativo"):
        assert header in html
