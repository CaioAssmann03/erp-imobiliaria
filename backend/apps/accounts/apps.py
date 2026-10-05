from django.apps import AppConfig
from typing_extensions import final, override


@final
class AccountsConfig(AppConfig):
    name = "apps.accounts"

    @override
    def ready(self) -> None:
        from . import audit, schema  # noqa: F401  (schema registers the OpenAPI scheme)

        audit.register()
