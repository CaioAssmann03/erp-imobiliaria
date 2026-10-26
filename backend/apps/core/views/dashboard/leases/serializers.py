from rest_framework import serializers


class LeaseSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField(help_text="ID da unidade")
    condominium = serializers.UUIDField()
    condominium_name = serializers.CharField()
    unit = serializers.CharField()
    tenant = serializers.CharField()
    end_date = serializers.DateField()
    ended = serializers.BooleanField()
