from typing import override

from django.apps import AppConfig


class BillingConfig(AppConfig):
    name = "apps.billing"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
