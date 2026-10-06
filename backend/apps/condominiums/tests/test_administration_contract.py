from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from ..models import AdministrationContract, Condominium
from ..serializers import AdministrationContractSerializer


def contract(**fields: object) -> AdministrationContract:
    return AdministrationContract(**{"fee_type": "fixed", **fields})


def clean_errors(instance: AdministrationContract) -> dict[str, list[str]]:
    with pytest.raises(ValidationError) as exc:
        instance.clean()
    return exc.value.message_dict


class TestContractModelRules:
    """The rules live in `AdministrationContract.clean()` (no database needed)."""

    def test_fixed_fee_requires_amount(self) -> None:
        assert "fee_amount" in clean_errors(contract())

    def test_fixed_fee_with_amount_is_valid(self) -> None:
        contract(fee_amount=Decimal("500")).clean()

    def test_variable_fee_requires_percentage_and_basis(self) -> None:
        errors = clean_errors(contract(fee_type="variable"))

        assert {"fee_percentage", "fee_basis"} <= set(errors)

    def test_variable_fee_with_percentage_and_basis_is_valid(self) -> None:
        contract(
            fee_type="variable", fee_percentage=Decimal("5"), fee_basis="revenue"
        ).clean()

    def test_floor_cannot_exceed_ceiling(self) -> None:
        errors = clean_errors(
            contract(
                fee_amount=Decimal("500"),
                fee_floor=Decimal("900"),
                fee_ceiling=Decimal("800"),
            )
        )

        assert "fee_floor" in errors

    def test_floor_equal_to_ceiling_is_valid(self) -> None:
        contract(
            fee_amount=Decimal("500"), fee_floor=Decimal("800"), fee_ceiling=Decimal("800")
        ).clean()


@pytest.mark.django_db
class TestContractSerializerUsesTheModelRules:
    """The serializer adds no rules of its own: it returns the model's errors as a 400."""

    def test_model_error_becomes_field_error(self) -> None:
        serializer = AdministrationContractSerializer(data={"fee_type": "fixed"})

        assert not serializer.is_valid()
        assert "fee_amount" in serializer.errors

    def test_valid_data_passes(self) -> None:
        serializer = AdministrationContractSerializer(
            data={"fee_type": "fixed", "fee_amount": "500.00"}
        )

        assert serializer.is_valid(), serializer.errors

@pytest.mark.django_db
class TestContractConstraints:
    def test_database_rejects_fixed_without_amount(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = AdministrationContract.objects.create(
                condominium=condominium, fee_type="fixed"
            )

    def test_database_rejects_variable_without_basis(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = AdministrationContract.objects.create(
                condominium=condominium,
                fee_type="variable",
                fee_percentage=Decimal("5"),
            )

    def test_database_rejects_floor_above_ceiling(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = AdministrationContract.objects.create(
                condominium=condominium,
                fee_amount=Decimal("500"),
                fee_floor=Decimal("900"),
                fee_ceiling=Decimal("800"),
            )

    def test_condominium_has_a_single_contract(self, condominium: Condominium) -> None:
        _ = AdministrationContract.objects.create(
            condominium=condominium, fee_amount=Decimal("500")
        )

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = AdministrationContract.objects.create(
                condominium=condominium, fee_amount=Decimal("600")
            )
