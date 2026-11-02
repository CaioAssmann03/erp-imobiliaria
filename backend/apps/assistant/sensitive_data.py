"""The filter that keeps personal data out of a question (spec 069, R4, R5).

It looks for an e-mail address and for any run of nine or more digits once the separators people type inside a number are
ignored: that covers CPF, CNPJ, phones, boleto lines, card and bank numbers. Names of people cannot be told from other words.
"""

import re
from enum import StrEnum

MINIMUM_DIGITS_OF_A_NUMBER = 9

EMAIL_ADDRESS = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
# Separators inside a number: `. - /`, the parentheses of an area code and a space before a group of three digits or more
# (so "01/02/2026 10:30" stays a date and a time, and "4111 1111 1111 1111" is one number).
SEPARATOR_INSIDE_A_NUMBER = re.compile(r"(?<=\d)(?:[.\-/]|\)\s?|\s?\(|\s(?=\d{3}))(?=\d)")
LONG_NUMBER = re.compile(rf"\d{{{MINIMUM_DIGITS_OF_A_NUMBER},}}")


class SensitiveData(StrEnum):
    EMAIL = "email"
    NUMBER = "number"


def find_sensitive_data(text: str) -> list[SensitiveData]:
    found: list[SensitiveData] = []
    if EMAIL_ADDRESS.search(text):
        found.append(SensitiveData.EMAIL)
    if LONG_NUMBER.search(SEPARATOR_INSIDE_A_NUMBER.sub("", text)):
        found.append(SensitiveData.NUMBER)
    return found
