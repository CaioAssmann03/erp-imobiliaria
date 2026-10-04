from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction

from ..models import AdministrationContract, Condominium
from ..serializers import AdministrationContractSerializer


def errors(data: dict[str, object]) -> dict[str, object] | None:
    serializer = AdministrationContractSerializer(data=data)
    return None if serializer.is_valid() else dict(serializer.errors)


def test_fixed_fee_requires_amount() -> None:
    result = errors({"fee_type": "fixed"})

    assert result is not None
    assert "fee_amount" in result


def test_fixed_fee_with_amount_is_valid() -> None:
    assert errors({"fee_type": "fixed", "fee_amount": "500.00"}) is None


def test_variable_fee_requires_percentage_and_basis() -> None:
    assert errors({"fee_type": "variable"}) is not None
    assert errors({"fee_type": "variable", "fee_percentage": "5"}) is not None
    assert errors({"fee_type": "variable", "fee_basis": "revenue"}) is not None


def test_variable_fee_with_percentage_and_basis_is_valid() -> None:
    data = {"fee_type": "variable", "fee_percentage": "5", "fee_basis": "revenue"}

    assert errors(data) is None


def test_floor_cannot_exceed_ceiling() -> None:
    data = {
        "fee_type": "fixed",
        "fee_amount": "500",
        "fee_floor": "900",
        "fee_ceiling": "800",
    }

    result = errors(data)

    assert result is not None
    assert "fee_floor" in result


def test_floor_equal_to_ceiling_is_valid() -> None:
    data = {
        "fee_type": "fixed",
        "fee_amount": "500",
        "fee_floor": "800",
        "fee_ceiling": "800",
    }

    assert errors(data) is None


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
