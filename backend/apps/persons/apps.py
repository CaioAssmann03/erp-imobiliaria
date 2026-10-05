from django.apps import AppConfig
from typing_extensions import final, override


@final
class PersonsConfig(AppConfig):
    name = "apps.persons"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
