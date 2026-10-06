from rest_framework import serializers
from typing_extensions import final

from apps.core.serializers import ModelRulesMixin

from ..models import Block


class BlockSerializer(ModelRulesMixin, serializers.ModelSerializer[Block]):
    @final
    class Meta:
        model = Block
        fields = ("id", "condominium", "name")
        read_only_fields = ("id",)
