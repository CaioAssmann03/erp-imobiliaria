import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from ..models import Block, Condominium, Unit
from ..serializers import UnitSerializer
from ..validators import validate_ideal_fraction


class TestUnitModelRules:
    """Rules live in the model (validators and `clean()`); no database needed."""

    def test_block_of_another_condominium_is_rejected(self) -> None:
        block = Block(condominium_id=uuid.uuid4(), name="A")
        unit = Unit(condominium_id=uuid.uuid4(), block=block, name="101")

        with pytest.raises(ValidationError) as exc:
            unit.clean()

        assert "block" in exc.value.message_dict

    def test_block_of_the_same_condominium_is_accepted(self) -> None:
        condominium_id = uuid.uuid4()
        block = Block(condominium_id=condominium_id, name="A")

        Unit(condominium_id=condominium_id, block=block, name="101").clean()

    def test_unit_without_block_is_accepted(self) -> None:
        Unit(condominium_id=uuid.uuid4(), name="101").clean()

    @pytest.mark.parametrize("fraction", [Decimal("0"), Decimal("-0.1"), Decimal("1.1")])
    def test_ideal_fraction_out_of_range_is_rejected(self, fraction: Decimal) -> None:
        with pytest.raises(ValidationError):
            validate_ideal_fraction(fraction)

    @pytest.mark.parametrize(
        "fraction", [Decimal("0.00000001"), Decimal("0.5"), Decimal("1")]
    )
    def test_ideal_fraction_in_range_is_accepted(self, fraction: Decimal) -> None:
        validate_ideal_fraction(fraction)


@pytest.mark.django_db
class TestUnitSerializerUsesTheModelRules:
    """The serializer adds no rules: model errors come back as a 400 on the right field."""

    def test_ideal_fraction_error_on_the_field(self, condominium: Condominium) -> None:
        serializer = UnitSerializer(
            data={"condominium": condominium.pk, "name": "101", "ideal_fraction": "1.5"}
        )

        assert not serializer.is_valid()
        assert "ideal_fraction" in serializer.errors

    def test_block_of_another_condominium_error_on_the_field(
        self, condominium: Condominium
    ) -> None:
        other = Condominium.objects.create(
            company=condominium.company, name="Outro", cnpj="45723174000110"
        )
        block = Block.objects.create(condominium=other, name="A")
        serializer = UnitSerializer(
            data={"condominium": condominium.pk, "block": block.pk, "name": "101"}
        )

        assert not serializer.is_valid()
        assert "block" in serializer.errors

    def test_valid_unit_passes(self, condominium: Condominium) -> None:
        serializer = UnitSerializer(
            data={"condominium": condominium.pk, "name": "101", "ideal_fraction": "0.5"}
        )

        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestUnitDatabaseRules:
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


@pytest.mark.django_db
class TestApportionmentCap:
    """Active units of a condominium cannot sum more than 1 (reaching 1 is only a pendency)."""

    def unit(self, condominium: Condominium, name: str, fraction: str, **fields: object) -> Unit:
        return Unit(
            condominium=condominium, name=name, ideal_fraction=Decimal(fraction), **fields
        )

    def test_sum_over_the_total_is_rejected(self, condominium: Condominium) -> None:
        self.unit(condominium, "1", "0.6").save()

        with pytest.raises(ValidationError) as exc:
            self.unit(condominium, "2", "0.5").clean()

        assert "ideal_fraction" in exc.value.message_dict

    def test_reaching_exactly_one_is_accepted(self, condominium: Condominium) -> None:
        self.unit(condominium, "1", "0.6").save()

        self.unit(condominium, "2", "0.4").clean()

    def test_inactive_units_do_not_count(self, condominium: Condominium) -> None:
        self.unit(condominium, "1", "0.9", active=False).save()

        self.unit(condominium, "2", "0.9").clean()

    def test_an_inactive_unit_is_not_checked(self, condominium: Condominium) -> None:
        self.unit(condominium, "1", "0.9").save()

        self.unit(condominium, "2", "0.9", active=False).clean()

    def test_updating_a_unit_does_not_count_itself(self, condominium: Condominium) -> None:
        unit = self.unit(condominium, "1", "0.9")
        unit.save()

        unit.ideal_fraction = Decimal("1")
        unit.clean()

    def test_other_condominiums_do_not_count(self, condominium: Condominium) -> None:
        other = Condominium.objects.create(
            company=condominium.company, name="Outro", cnpj="45723174000110"
        )
        self.unit(other, "1", "0.9").save()

        self.unit(condominium, "1", "0.9").clean()

    def test_api_answers_400_on_the_field(self, condominium: Condominium) -> None:
        self.unit(condominium, "1", "0.6").save()
        serializer = UnitSerializer(
            data={"condominium": condominium.pk, "name": "2", "ideal_fraction": "0.5"}
        )

        assert not serializer.is_valid()
        assert "ideal_fraction" in serializer.errors
