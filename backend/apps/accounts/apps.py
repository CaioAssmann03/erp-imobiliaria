from typing import final, override

from django.apps import AppConfig


@final
class AccountsConfig(AppConfig):
    name = "apps.accounts"

    @override
    def ready(self) -> None:
        from . import audit, schema  # noqa: F401  (schema registers the OpenAPI scheme)

        audit.register()
