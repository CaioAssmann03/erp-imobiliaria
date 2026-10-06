from collections.abc import Callable
from typing import ClassVar

from rest_framework import serializers
from typing_extensions import final

from apps.core.validators.cpf import validate_cpf

from ..models import PeopleIndividual


class PeopleIndividualSerializer(serializers.ModelSerializer[PeopleIndividual]):
    @final
    class Meta:
        model = PeopleIndividual
        fields = ("cpf", "rg", "birthday", "marital_status", "job")
        extra_kwargs: ClassVar[dict[str, dict[str, list[Callable[[str], None]]]]] = {
            "cpf": {"validators": [validate_cpf]},
            "rg": {"validators": []},
        }
