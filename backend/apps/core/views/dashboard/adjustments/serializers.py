from rest_framework import serializers


class AdjustmentByMonthSerializer(serializers.Serializer[dict[str, object]]):
    month = serializers.CharField(help_text='"overdue" ou AAAA-MM')
    total = serializers.IntegerField()


class UpcomingAdjustmentSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    date = serializers.DateField()
    adjustment_index = serializers.CharField(allow_blank=True)
    overdue = serializers.BooleanField()
