from typing import override

from django.apps import AppConfig


class CondominiumsConfig(AppConfig):
    name = "apps.condominiums"

    @override
    def ready(self) -> None:
        from apps.persons.modules import register_person_module

        from . import audit
        from .modules import MODULE

        audit.register()
        register_person_module(MODULE)
