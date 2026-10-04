import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from ..models import Block, Condominium, Unit
from ..serializers import UnitSerializer


class TestUnitSerializerRules:
    def test_block_from_another_condominium_is_rejected(self) -> None:
        condominium = Condominium(id=uuid.uuid4())
        block = Block(condominium_id=uuid.uuid4(), name="A")

        with pytest.raises(Exception) as exc:
            _ = UnitSerializer().validate(
                {"condominium": condominium, "block": block}
            )

        assert "block" in str(exc.value)

    def test_block_from_same_condominium_is_accepted(self) -> None:
        condominium = Condominium(id=uuid.uuid4())
        block = Block(condominium_id=condominium.id, name="A")
        attrs = {"condominium": condominium, "block": block}

        assert UnitSerializer().validate(attrs) == attrs

    @pytest.mark.parametrize("fraction", [Decimal("0"), Decimal("-0.1"), Decimal("1.1")])
    def test_ideal_fraction_out_of_range_is_rejected(self, fraction: Decimal) -> None:
        with pytest.raises(Exception) as exc:
            _ = UnitSerializer().validate({"ideal_fraction": fraction})

        assert "ideal_fraction" in str(exc.value)

    @pytest.mark.parametrize("fraction", [Decimal("0.00000001"), Decimal("0.5"), Decimal("1")])
    def test_ideal_fraction_in_range_is_accepted(self, fraction: Decimal) -> None:
        attrs = {"ideal_fraction": fraction}

        assert UnitSerializer().validate(attrs) == attrs


@pytest.mark.django_db
class TestUnitModelRules:
    def test_clean_rejects_block_of_another_condominium(
        self, condominium: Condominium
    ) -> None:
        other = Condominium.objects.create(
            company=condominium.company, name="Outro", cnpj="45723174000110"
        )
        block = Block.objects.create(condominium=other, name="A")
        unit = Unit(condominium=condominium, block=block, name="101")

        with pytest.raises(ValidationError):
            unit.clean()

    def test_name_is_unique_within_a_block(self, condominium: Condominium) -> None:
        block = Block.objects.create(condominium=condominium, name="A")
        _ = Unit.objects.create(condominium=condominium, block=block, name="101")

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(condominium=condominium, block=block, name="101")

    def test_same_name_is_allowed_in_different_blocks(
        self, condominium: Condominium
    ) -> None:
        a = Block.objects.create(condominium=condominium, name="A")
        b = Block.objects.create(condominium=condominium, name="B")
        _ = Unit.objects.create(condominium=condominium, block=a, name="101")

        _ = Unit.objects.create(condominium=condominium, block=b, name="101")

    def test_name_is_unique_without_block(self, condominium: Condominium) -> None:
        _ = Unit.objects.create(condominium=condominium, name="101")

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(condominium=condominium, name="101")

    def test_negative_utility_values_are_rejected(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(
                condominium=condominium, name="101", water_value=Decimal("-1")
            )

    def test_ideal_fraction_above_one_is_rejected(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Unit.objects.create(
                condominium=condominium, name="101", ideal_fraction=Decimal("1.5")
            )


@pytest.mark.django_db
class TestBlock:
    def test_name_is_unique_per_condominium(self, condominium: Condominium) -> None:
        _ = Block.objects.create(condominium=condominium, name="A")

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = Block.objects.create(condominium=condominium, name="A")
