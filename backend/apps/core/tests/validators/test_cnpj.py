import pytest
from apps.core.validators import validate_cnpj
from django.core.exceptions import ValidationError


def test_valid_cnpj() -> None:
    # should be valid
    validate_cnpj("11222333000181")


def test_wrong_check_digit() -> None:
    with pytest.raises(ValidationError):
        validate_cnpj("11222333000182")


def test_repeated_digits() -> None:
    with pytest.raises(ValidationError):
        validate_cnpj("11111111111111")


def test_wrong_length_or_mask() -> None:
    with pytest.raises(ValidationError):
        validate_cnpj("11.222.333/0001-81")
