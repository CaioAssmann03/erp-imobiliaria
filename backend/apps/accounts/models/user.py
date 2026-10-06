import uuid
from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db import models
from typing_extensions import final, override

from apps.core.models import Company

from .user_manager import UserManager


@final
class User(AbstractUser):
    """Credencial de acesso ao sistema (login e permissões).

    Por enquanto só administradores entram; o `Person` continua sendo a entidade de negócio.
    Quando pessoas passarem a logar, o vínculo entra em `persons.Person`, e não aqui:
    `user = OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True,
    on_delete=SET_NULL, related_name="person")`. Assim o `accounts` não depende do domínio.
    """

    company_lookup = "company"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="users")

    objects: ClassVar[UserManager] = UserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ("username",)

    @override
    def __str__(self) -> str:
        return self.get_username()
