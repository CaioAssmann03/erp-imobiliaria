import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from typing_extensions import final, override


@final
class User(AbstractUser):
    """Credencial de acesso ao sistema (login e permissões).

    Por enquanto só administradores entram; o `Person` continua sendo a entidade de negócio.
    Quando pessoas passarem a logar, o vínculo entra em `persons.Person`, e não aqui:
    `user = OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True,
    on_delete=SET_NULL, related_name="person")`. Assim o `accounts` não depende do domínio.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ("username",)

    @override
    def __str__(self) -> str:
        return self.get_username()
