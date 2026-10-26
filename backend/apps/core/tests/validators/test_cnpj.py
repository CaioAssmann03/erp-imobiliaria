import pytest
from apps.core.infrastructure.validators import validate_cnpj
from django.core.exceptions import ValidationError


def test_valid_cnpj() -> None:
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


@pytest.mark.parametrize(
    ("cnpj", "code", "message"),
    [
        ("11.222.333/0001-81", "cnpj.invalid_length", "CNPJ must have 14 characters, without punctuation."),
        ("11222333000182", "cnpj.invalid_check_digits", "Invalid CNPJ."),
        ("11111111111111", "cnpj.invalid_check_digits", "Invalid CNPJ."),
    ],
)
def test_errors_have_english_messages_and_stable_codes(cnpj: str, code: str, message: str) -> None:
    with pytest.raises(ValidationError) as raised:
        validate_cnpj(cnpj)

    assert raised.value.code == code
    assert raised.value.message == message
