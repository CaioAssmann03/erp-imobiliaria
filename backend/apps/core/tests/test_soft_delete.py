"""Spec 062, R1/R2/R8: deleting a registry record archives it; the row stays but leaves the default queries."""

import pytest
from auditlog.models import LogEntry
from django.core.exceptions import ValidationError

from apps.condominiums.models import Block, Condominium
from apps.core.models import Company

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


@pytest.fixture
def condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Residencial Sol", cnpj=CNPJ, active=False)


@pytest.fixture
def block(condominium: Condominium) -> Block:
    return Block.objects.create(condominium=condominium, name="Bloco A")


def test_delete_archives_and_keeps_the_row(block: Block) -> None:
    _ = block.delete()

    stored = Block.all_objects.get(pk=block.pk)
    assert stored.is_archived
    assert stored.deleted_at is not None


def test_archived_leaves_default_queries_but_is_still_reachable(condominium: Condominium, block: Block) -> None:
    _ = block.delete()

    assert not Block.objects.filter(pk=block.pk).exists()
    assert Block.all_objects.filter(pk=block.pk).exists()
    assert Block.all_objects.archived().count() == 1
    assert not condominium.blocks.exists()  # a reverse relation hides what is archived


def test_a_record_still_reaches_what_was_archived(condominium: Condominium, block: Block) -> None:
    unit_block = block
    _ = condominium.blocks.get().delete()

    assert Block.all_objects.get(pk=unit_block.pk).condominium == condominium


def test_a_queryset_delete_archives_each_row_and_obeys_the_rules(condominium: Condominium) -> None:
    first = Block.objects.create(condominium=condominium, name="Bloco A")
    _ = Block.objects.create(condominium=condominium, name="Bloco B")

    count, _detail = Block.objects.filter(condominium=condominium).delete()

    assert count == 2
    assert Block.all_objects.get(pk=first.pk).is_archived
    assert not Block.objects.exists()

    condominium.active = True
    condominium.save()
    with pytest.raises(ValidationError):
        _ = Condominium.objects.filter(pk=condominium.pk).delete()
    assert Condominium.objects.filter(pk=condominium.pk).exists()


def test_hard_delete_removes_the_row_for_good(block: Block) -> None:
    _ = block.hard_delete()

    assert not Block.all_objects.filter(pk=block.pk).exists()


def test_restore_brings_the_record_back(block: Block) -> None:
    _ = block.delete()

    block.restore()

    assert Block.objects.filter(pk=block.pk).exists()
    assert not block.is_archived


def test_restore_is_refused_when_the_name_was_taken_meanwhile(condominium: Condominium, block: Block) -> None:
    _ = block.delete()
    _ = Block.objects.create(condominium=condominium, name="Bloco A")

    with pytest.raises(ValidationError):
        block.restore()

    assert Block.all_objects.get(pk=block.pk).is_archived


def test_archive_and_restore_are_audited(condominium: Condominium) -> None:
    _ = condominium.delete()
    condominium.restore()

    entries = LogEntry.objects.get_for_object(condominium)
    changed_fields = {field for entry in entries for field in entry.changes_dict}

    assert "deleted_at" in changed_fields
    assert entries.count() >= 3  # created, archived, restored
