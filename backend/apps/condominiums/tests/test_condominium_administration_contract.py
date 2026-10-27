from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from ..models import CondominiumAdministrationContract


def contract(**fields: object) -> CondominiumAdministrationContract:
    return CondominiumAdministrationContract(**{"fee_type": "fixed", **fields})


def clean_errors(instance: CondominiumAdministrationContract) -> dict[str, list[str]]:
    with pytest.raises(ValidationError) as exc:
        instance.clean()
    return exc.value.message_dict


class TestContractModelRules:
    """The rules live in `CondominiumAdministrationContract.clean()` (no database needed)."""

    def test_fixed_fee_requires_amount(self) -> None:
        assert "fee_amount" in clean_errors(contract())


    def test_variable_fee_requires_percentage_and_basis(self) -> None:
        errors = clean_errors(contract(fee_type="variable"))

        assert {"fee_percentage", "fee_basis"} <= set(errors)


    def test_floor_cannot_exceed_ceiling(self) -> None:
        errors = clean_errors(
            contract(
                fee_amount=Decimal("500"),
                fee_floor=Decimal("900"),
                fee_ceiling=Decimal("800"),
            )
        )

        assert "fee_floor" in errors
