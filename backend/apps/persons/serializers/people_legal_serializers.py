from collections.abc import Callable
from typing import ClassVar

from rest_framework import serializers
from typing_extensions import final

from apps.core.validators.cnpj import validate_cnpj

from ..models import PeopleLegal


class PeopleLegalSerializer(serializers.ModelSerializer):
    @final
    class Meta:
        model = PeopleLegal
        fields = ("cnpj", "ie")
        extra_kwargs: ClassVar[dict[str, dict[str, list[Callable[[str], None]]]]] = {
            "cnpj": {"validators": [validate_cnpj]}
        }
