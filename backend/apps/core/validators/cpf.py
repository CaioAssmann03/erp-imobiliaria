import re

from django.core.exceptions import ValidationError


def _check_digit(base: str) -> int:
    weights = range(len(base) + 1, 1, -1)
    total = sum(int(digit) * weight for digit, weight in zip(base, weights))
    rest = (total * 10) % 11
    return 0 if rest == 10 else rest


def validate_cpf(value: str) -> None:
    if not re.fullmatch(r"[0-9]{11}", value):
        raise ValidationError("CPF deve ter 11 dígitos, sem pontuação.")
    if len(set(value)) == 1:  # 00000000000, 11111111111...
        raise ValidationError("CPF inválido.")
    d1 = _check_digit(value[:9])
    d2 = _check_digit(value[:10])
    if value[9:] != f"{d1}{d2}":
        raise ValidationError("CPF inválido.")
