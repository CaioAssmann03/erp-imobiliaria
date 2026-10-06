from django.apps import AppConfig
from typing_extensions import override


class FinanceConfig(AppConfig):
    name = "apps.finance"

    @override
    def ready(self) -> None:
        from . import audit

        audit.register()
