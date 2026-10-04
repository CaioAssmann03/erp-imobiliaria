from apps.core.validators import validate_cpf
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from typing_extensions import final


@final
class CpfValidatorTests(SimpleTestCase):
    def test_valid_cpf(self) -> None:
        validate_cpf("52998224725")

    def test_wrong_check_digit(self) -> None:
        with self.assertRaises(ValidationError):
            validate_cpf("52998224724")

    def test_repeated_digits(self) -> None:
        with self.assertRaises(ValidationError):
            validate_cpf("11111111111")

    def test_wrong_length_or_mask(self) -> None:
        with self.assertRaises(ValidationError):
            validate_cpf("529.982.247-25")
