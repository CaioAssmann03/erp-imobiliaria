from typing import override

from django.apps import AppConfig


class RentalsConfig(AppConfig):
    name = "apps.rentals"

    @override
    def ready(self) -> None:
        from apps.persons.modules import register_person_module

        from .modules import MODULE

        register_person_module(MODULE)
