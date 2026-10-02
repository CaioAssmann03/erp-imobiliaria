from django.apps import AppConfig
from typing_extensions import final


@final
class PersonsConfig(AppConfig):
    name = "apps.persons"
