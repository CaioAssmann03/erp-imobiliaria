from typing import override

from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "apps.core"

    @override
    def ready(self) -> None:
        from . import audit, checks  # noqa: F401  (checks registers itself)

        audit.register()
