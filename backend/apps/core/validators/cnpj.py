import re

from django.core.exceptions import ValidationError

_WEIGHTS_1 = (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
_WEIGHTS_2 = (6, *_WEIGHTS_1)


def _check_digit(base: str, weights: tuple[int, ...]) -> int:
    total = sum((ord(c) - 48) * w for c, w in zip(base, weights))
    rest = total % 11
    return 0 if rest < 2 else 11 - rest


"""Cnpj também aceita alfa numéricos"""


def validate_cnpj(value: str) -> None:
    if not re.fullmatch(r"[0-9A-Z]{12}[0-9]{2}", value):
        raise ValidationError("CNPJ deve ter 14 caracteres, sem pontuação.")
    if len(set(value)) == 1:  # 00000000000000, 11111111111111...
        raise ValidationError("CNPJ inválido.")
    d1 = _check_digit(value[:12], _WEIGHTS_1)
    d2 = _check_digit(value[:13], _WEIGHTS_2)
    if value[12:] != f"{d1}{d2}":
        raise ValidationError("CNPJ inválido.")
