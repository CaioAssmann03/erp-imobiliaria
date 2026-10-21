from typing import Any, override

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _fernet() -> Fernet:
    return Fernet(settings.GATEWAY_CREDENTIALS_KEY)


class EncryptedTextField(models.TextField):  # type: ignore[type-arg]
    """Text encrypted at rest with Fernet (key from `GATEWAY_CREDENTIALS_KEY`); Python code sees the plain text.

    It cannot be searched or filtered in the database, which is the point for a credential.
    """

    @override
    def get_prep_value(self, value: Any) -> Any:
        value = super().get_prep_value(value)
        if value is None or value == "":
            return value
        return _fernet().encrypt(value.encode()).decode()

    def from_db_value(self, value: str | None, expression: Any, connection: Any) -> str | None:
        if value is None or value == "":
            return value
        try:
            return _fernet().decrypt(value.encode()).decode()
        except InvalidToken as error:
            raise ValueError("Stored credential cannot be decrypted: check GATEWAY_CREDENTIALS_KEY.") from error
