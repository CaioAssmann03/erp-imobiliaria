from django.apps import AppConfig
from typing_extensions import final


@final
class AccountsConfig(AppConfig):
    name = "apps.accounts"
