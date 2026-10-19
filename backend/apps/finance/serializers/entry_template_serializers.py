from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import EntryTemplate


class EntryTemplateSerializer(ModelRulesMixin, serializers.ModelSerializer[EntryTemplate]):
    @final
    class Meta:
        model = EntryTemplate
        fields = (
            "id",
            "cost_center",
            "name",
            "active",
            "has_accumulation_history",
            "accumulate_to_balance",
            "is_subject_to_social_security",
            "admin_fee_incidence_percentage",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
