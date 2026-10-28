from rest_framework import serializers


class TotalByTypeSerializer(serializers.Serializer[dict[str, object]]):
    type = serializers.CharField()
    title = serializers.CharField()
    total = serializers.IntegerField()


class SummarySerializer(serializers.Serializer[dict[str, object]]):
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    by_type = TotalByTypeSerializer(many=True)
