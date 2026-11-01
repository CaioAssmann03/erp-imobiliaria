from typing import final

from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin
from apps.persons.serializers import PersonSerializer

from ..models import UnitPerson


class UnitPersonSerializer(ModelRulesMixin, serializers.ModelSerializer[UnitPerson]):
    person_detail = PersonSerializer(source="person", read_only=True)
    is_current = serializers.SerializerMethodField(help_text="No end date, or ending today or later (the server's date).")

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
            "is_current",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    @extend_schema_field(serializers.BooleanField())
    def get_is_current(self, link: UnitPerson) -> bool:
        return link.is_current(timezone.localdate())
