from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin
from apps.persons.serializers import PersonSerializer

from ..models import UnitPerson


class UnitPersonSerializer(ModelRulesMixin, serializers.ModelSerializer[UnitPerson]):
    person_detail = PersonSerializer(source="person", read_only=True)

    @final
    class Meta:
        model = UnitPerson
        fields = (
            "id",
            "unit",
            "person",
            "person_detail",
            "role",
            "ownership_percentage",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
