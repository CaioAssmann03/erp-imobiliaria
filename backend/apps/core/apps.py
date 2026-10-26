from typing import override

from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "apps.core"

    @override
    def ready(self) -> None:
        from .infrastructure import audit

        audit.register()
