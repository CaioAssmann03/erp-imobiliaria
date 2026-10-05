from django.apps import AppConfig
from typing_extensions import override


class CondominiumsConfig(AppConfig):
    name = "apps.condominiums"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
