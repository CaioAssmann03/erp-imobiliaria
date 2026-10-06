from django.apps import AppConfig
from typing_extensions import override


class FinanceConfig(AppConfig):
    name = "apps.finance"

    @override
    def ready(self) -> None:
        import finance.signals

        from . import audit

        audit.register()
