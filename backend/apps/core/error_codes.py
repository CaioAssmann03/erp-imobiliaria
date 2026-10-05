"""Stable error codes of the shared validators (spec 006).

A code is part of the API contract: adding one is compatible, renaming or removing one is
breaking. Shared validators do not know their field, so their codes are `<validator>.<reason>`.
"""

from enum import StrEnum


class CoreErrorCode(StrEnum):
    CPF_INVALID_LENGTH = "cpf.invalid_length"
    CPF_INVALID_CHECK_DIGITS = "cpf.invalid_check_digits"
    CNPJ_INVALID_LENGTH = "cnpj.invalid_length"
    CNPJ_INVALID_CHECK_DIGITS = "cnpj.invalid_check_digits"
    PERCENTAGE_OUT_OF_RANGE = "percentage.out_of_range"
