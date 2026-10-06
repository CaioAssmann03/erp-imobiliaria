from rest_framework import serializers
from typing_extensions import final

from apps.core.serializers import ModelRulesMixin
from apps.persons.serializers import PersonSerializer

from ..models import Supplier


class SupplierSerializer(ModelRulesMixin, serializers.ModelSerializer[Supplier]):
    person_detail = PersonSerializer(source="person", read_only=True)

    @final
    class Meta:
        model = Supplier
        fields = (
            "id",
            "person",
            "person_detail",
            "bank_code",
            "branch",
            "account_number",
            "account_kind",
            "pix_key",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
