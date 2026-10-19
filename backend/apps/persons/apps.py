from typing import final, override

from django.apps import AppConfig


@final
class PersonsConfig(AppConfig):
    name = "apps.persons"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
