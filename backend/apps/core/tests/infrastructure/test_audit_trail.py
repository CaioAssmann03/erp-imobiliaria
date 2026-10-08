"""The change audit trail (spec 005, R1, R2, R3, R5, R6, R7, R8)."""

import json

import pytest
from auditlog.models import LogEntry
from django.apps import apps as django_apps
from django.contrib import admin
from django.db import transaction
from django.test import RequestFactory

from apps.accounts.models import User
from apps.condominiums.models import Block, Condominium
from apps.core.audit import AUDIT_EXEMPT, is_audited
from apps.core.models import Company

pytestmark = pytest.mark.django_db


@pytest.fixture
def condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Residencial Sol", cnpj="11222333000181")


def entries_for(record: object) -> list[LogEntry]:
    return list(LogEntry.objects.get_for_object(record).order_by("timestamp"))


# ----- R1, R2: create, update and delete are logged -----


def test_auditlog_logs_create_update_delete_on_postgres(condominium: Condominium) -> None:
    block = Block.objects.create(condominium=condominium, name="A")
    block.name = "B"
    block.save()
    block_id = block.pk
    block.delete()

    actions = [
        entry.action
        for entry in LogEntry.objects.filter(object_pk=str(block_id)).order_by("timestamp")
    ]

    assert actions == [LogEntry.Action.CREATE, LogEntry.Action.UPDATE, LogEntry.Action.DELETE]


def test_create_update_delete_write_entries_with_changes(condominium: Condominium) -> None:
    block = Block.objects.create(condominium=condominium, name="A")
    block.name = "B"
    block.save()

    create_entry, update_entry = entries_for(block)

    assert create_entry.changes["name"] == ["None", "A"]
    assert update_entry.changes == {"name": ["A", "B"]}
    assert update_entry.object_repr == str(block)
    assert update_entry.timestamp is not None
    assert update_entry.content_type.model == "block"


# ----- R3: no actor outside a request -----


def test_command_write_logs_no_actor(condominium: Condominium) -> None:
    block = Block.objects.create(condominium=condominium, name="A")

    assert entries_for(block)[0].actor is None


# ----- R5: atomic with the change -----


def test_rolled_back_write_leaves_no_entry(condominium: Condominium) -> None:
    before = LogEntry.objects.count()

    with pytest.raises(RuntimeError), transaction.atomic():
        _ = Block.objects.create(condominium=condominium, name="A")
        raise RuntimeError("boom")

    assert LogEntry.objects.count() == before


# ----- R6: superuser-only, read-only admin -----


def request_as(user: User):  # type: ignore[no-untyped-def]
    request = RequestFactory().get("/admin/")
    request.user = user
    return request


@pytest.fixture
def staff(company: Company) -> User:
    return User.objects.create_user("staff", password="x", company=company, is_staff=True)


@pytest.fixture
def superuser(company: Company) -> User:
    return User.objects.create_superuser("root", password="x", company=company)


def test_log_admin_visible_only_to_superuser(staff: User, superuser: User) -> None:
    log_admin = admin.site._registry[LogEntry]

    assert log_admin.has_view_permission(request_as(superuser))
    assert log_admin.has_module_permission(request_as(superuser))
    assert not log_admin.has_view_permission(request_as(staff))
    assert not log_admin.has_module_permission(request_as(staff))


def test_log_admin_is_read_only(superuser: User) -> None:
    log_admin = admin.site._registry[LogEntry]
    request = request_as(superuser)

    assert not log_admin.has_add_permission(request)
    assert not log_admin.has_change_permission(request)
    assert not log_admin.has_delete_permission(request)


# ----- R7: company and user are audited -----


def test_company_is_audited(company: Company) -> None:
    company.trade_name = "Nova marca"
    company.save()

    assert entries_for(company)[-1].changes["trade_name"][1] == "Nova marca"


# ----- R8: guard -----


def test_every_model_is_audited_or_exempt() -> None:
    missing = [
        model.__name__
        for config in django_apps.get_app_configs()
        if config.name.startswith("apps.")
        for model in config.get_models()
        if not is_audited(model) and model._meta.label not in AUDIT_EXEMPT
    ]

    assert missing == []


def test_exempt_models_have_a_reason() -> None:
    assert all(reason.strip() for reason in AUDIT_EXEMPT.values())


def test_changes_are_json_serializable(condominium: Condominium) -> None:
    block = Block.objects.create(condominium=condominium, name="A")

    assert json.dumps(entries_for(block)[0].changes)
