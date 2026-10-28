import uuid

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from ..models import Block, Condominium, Unit


class TestUnitModelRules:
    """Rules live in the model (validators and `clean()`); no database needed."""

    def test_block_of_another_condominium_is_rejected(self) -> None:
        block = Block(condominium_id=uuid.uuid4(), name="A")
        unit = Unit(condominium_id=uuid.uuid4(), block=block, name="101")

        with pytest.raises(ValidationError) as exc:
            unit.clean()

        assert "block" in exc.value.message_dict


@pytest.mark.django_db
class TestUnitDatabaseRules:

    def test_name_is_unique_within_a_block(self, condominium: Condominium) -> None:
        block = Block.objects.create(condominium=condominium, name="A")
        _ = Unit.objects.create(condominium=condominium, block=block, name="101")

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(condominium=condominium, block=block, name="101")


    def test_name_is_unique_without_block(self, condominium: Condominium) -> None:
        _ = Unit.objects.create(condominium=condominium, name="101")

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(condominium=condominium, name="101")
