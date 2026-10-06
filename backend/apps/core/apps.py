from django.apps import AppConfig
from typing_extensions import override


class CoreConfig(AppConfig):
    name = "apps.core"

    @override
    def ready(self) -> None:
        from . import audit, checks  # noqa: F401  (checks registers itself)

        audit.register()
