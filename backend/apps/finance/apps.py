from typing import override

from django.apps import AppConfig


class FinanceConfig(AppConfig):
    name = "apps.finance"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
