import re

from django.core.exceptions import ValidationError


def _check_digit(leading_digits: str) -> int:
    weights = range(len(leading_digits) + 1, 1, -1)
    weighted_sum = sum(int(digit) * weight for digit, weight in zip(leading_digits, weights))
    remainder = (weighted_sum * 10) % 11
    return 0 if remainder == 10 else remainder


def validate_cpf(cpf: str) -> None:
    if not re.fullmatch(r"[0-9]{11}", cpf):
        raise ValidationError("CPF deve ter 11 dígitos, sem pontuação.")
    if len(set(cpf)) == 1:  # 00000000000, 11111111111...
        raise ValidationError("CPF inválido.")
    first_check_digit = _check_digit(cpf[:9])
    second_check_digit = _check_digit(cpf[:10])
    if cpf[9:] != f"{first_check_digit}{second_check_digit}":
        raise ValidationError("CPF inválido.")
