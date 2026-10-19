from typing import override

from django.apps import AppConfig


class CondominiumsConfig(AppConfig):
    name = "apps.condominiums"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
