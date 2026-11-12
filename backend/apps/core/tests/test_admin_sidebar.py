"""Spec 063, R1/R2: the Admin sidebar is grouped, in Portuguese, and lists every registered model."""

from typing import Any, cast

import pytest
from django.conf import settings
from django.contrib import admin
from django.urls import reverse


def unfold_settings() -> dict[str, Any]:
    return cast(dict[str, Any], settings.UNFOLD)


def sidebar_groups() -> list[dict[str, Any]]:
    return cast(list[dict[str, Any]], unfold_settings()["SIDEBAR"]["navigation"])


def test_the_sidebar_is_grouped_and_links_the_archived_page() -> None:
    assert [group["title"] for group in sidebar_groups()] == ["Cadastros", "Financeiro", "Cobrança", "Gateway e boletos (técnico)", "Sistema"]
    links = [str(item["link"]) for group in sidebar_groups() for item in group["items"]]

    assert reverse("admin_archived") in links


def test_every_registered_model_has_a_sidebar_item() -> None:
    linked = {str(item["link"]) for group in sidebar_groups() for item in group["items"]}
    missing = [
        f"{model._meta.app_label}.{model.__name__}"
        for model in admin.site._registry
        if reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_changelist") not in linked
    ]

    assert missing == []


@pytest.mark.django_db
def test_the_admin_renders_the_sidebar_groups(client, company) -> None:  # type: ignore[no-untyped-def]
    from apps.accounts.models import User

    client.force_login(User.objects.create_superuser("root", password="x", company=company))

    html = client.get(reverse("admin:index")).content.decode()

    for title in ("Cadastros", "Financeiro", "Cobrança", "Gateway e boletos (técnico)", "Sistema", "Arquivados", "Condomínios"):
        assert title in html


@pytest.mark.django_db
def test_the_home_shows_a_card_per_group_and_the_archived_count(client, company) -> None:  # type: ignore[no-untyped-def]
    from apps.accounts.models import User
    from apps.condominiums.models import Block, Condominium

    condominium = Condominium.objects.create(company=company, name="Sol", cnpj="11222333000181", active=False)
    _ = Block.objects.create(condominium=condominium, name="A").delete()
    client.force_login(User.objects.create_superuser("root", password="x", company=company))

    html = client.get(reverse("admin:index")).content.decode()

    assert "Administração" in html
    assert html.count("<section") >= len(sidebar_groups())
    assert 'rounded-full text-white text-xs">1<' in html.replace("\n", "").replace("  ", "")


def test_the_admin_uses_the_orange_of_the_site() -> None:
    assert unfold_settings()["COLORS"]["primary"]["600"] == "#f05a28"
    assert unfold_settings()["COLORS"]["base"]["900"] == "#21211f"


@pytest.mark.django_db
def test_the_admin_loads_the_theme_stylesheet(client, company) -> None:  # type: ignore[no-untyped-def]
    from django.contrib.staticfiles import finders

    from apps.accounts.models import User

    client.force_login(User.objects.create_superuser("root", password="x", company=company))

    html = client.get(reverse("admin:index")).content.decode()

    assert "admin/metri.css" in html
    assert finders.find("admin/metri.css") is not None
