from typing import override

from django.apps import AppConfig


class RentalsConfig(AppConfig):
    name = "apps.rentals"

    @override
    def ready(self) -> None:
        from apps.persons.modules import register_person_module

        from . import audit

        audit.register()
        register_person_module("rentals", "rental_person_member")
