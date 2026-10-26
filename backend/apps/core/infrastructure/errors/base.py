"""The base of every rule error: its stable code and its English message, declared together (spec 006)."""

from enum import StrEnum
from typing import Self

from django.core.exceptions import ValidationError


class RuleError(StrEnum):
    """Base of the enums in `apps/<app>/errors/<entity>.py`.

    A member is declared as `NAME = ("model.field.reason", "English message")`. Its value is the
    code (`member.value`, what the API answers); `member.message` is the English fallback text.
    The frontend translates by code (`lib/error-messages.ts`).
    """

    message: str

    def __new__(cls, code: str, message: str) -> Self:
        member = str.__new__(cls, code)
        member._value_ = code
        member.message = message
        return member

    def to_validation_error(self) -> ValidationError:
        return ValidationError(self.message, code=self.value)
