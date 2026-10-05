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

    def test_errors_have_english_messages_and_stable_codes(self) -> None:
        for cpf, code, message in [
            ("529.982.247-25", "cpf.invalid_length", "CPF must have 11 digits, without punctuation."),
            ("52998224724", "cpf.invalid_check_digits", "Invalid CPF."),
            ("11111111111", "cpf.invalid_check_digits", "Invalid CPF."),
        ]:
            with self.assertRaises(ValidationError) as raised:
                validate_cpf(cpf)
            self.assertEqual(raised.exception.code, code)
            self.assertEqual(raised.exception.message, message)
