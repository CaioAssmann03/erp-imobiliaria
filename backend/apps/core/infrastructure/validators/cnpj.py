import re

from apps.core.infrastructure.errors.validators import CoreValidatorError

_FIRST_DIGIT_WEIGHTS = (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
_SECOND_DIGIT_WEIGHTS = (6, *_FIRST_DIGIT_WEIGHTS)
_ASCII_ZERO = 48  # alphanumeric CNPJ: each character counts as its ASCII code minus this


def _check_digit(leading_characters: str, weights: tuple[int, ...]) -> int:
    weighted_sum = sum(
        (ord(character) - _ASCII_ZERO) * weight
        for character, weight in zip(leading_characters, weights)
    )
    remainder = weighted_sum % 11
    return 0 if remainder < 2 else 11 - remainder


def validate_cnpj(cnpj: str) -> None:
    """Validate a CNPJ without punctuation (letters are accepted: the alphanumeric CNPJ)."""
    if not re.fullmatch(r"[0-9A-Z]{12}[0-9]{2}", cnpj):
        raise CoreValidatorError.CNPJ_INVALID_LENGTH.to_validation_error()
    if len(set(cnpj)) == 1:  # 00000000000000, 11111111111111...
        raise CoreValidatorError.CNPJ_INVALID_CHECK_DIGITS.to_validation_error()
    first_check_digit = _check_digit(cnpj[:12], _FIRST_DIGIT_WEIGHTS)
    second_check_digit = _check_digit(cnpj[:13], _SECOND_DIGIT_WEIGHTS)
    if cnpj[12:] != f"{first_check_digit}{second_check_digit}":
        raise CoreValidatorError.CNPJ_INVALID_CHECK_DIGITS.to_validation_error()
