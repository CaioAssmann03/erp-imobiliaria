import pytest
from django.core.exceptions import ValidationError

from ..validators import validate_bank_code


@pytest.mark.parametrize("bank_code", ["001", "033", "341", "000"])
def test_valid_bank_codes(bank_code: str) -> None:
    validate_bank_code(bank_code)


@pytest.mark.parametrize("bank_code", ["", "33", "0331", "abc", "03a", " 33", "03 "])
def test_bank_code(bank_code: str) -> None:
    with pytest.raises(ValidationError) as raised:
        validate_bank_code(bank_code)

    assert raised.value.code == "bank_code.invalid_format"
    assert raised.value.message == "The bank code must have exactly 3 digits."
