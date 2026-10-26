from typing import override

from django.apps import AppConfig


class CondominiumsConfig(AppConfig):
    name = "apps.condominiums"

    @override
    def ready(self) -> None:
        from apps.persons.modules import register_person_module

        from . import audit

        audit.register()
        register_person_module("condominiums", "condominium_person_member")
