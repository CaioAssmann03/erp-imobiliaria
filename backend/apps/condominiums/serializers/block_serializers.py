from rest_framework import serializers
from typing_extensions import final

from ..models import Block


class BlockSerializer(serializers.ModelSerializer[Block]):
    @final
    class Meta:
        model = Block
        fields = ("id", "condominium", "name")
        read_only_fields = ("id",)
