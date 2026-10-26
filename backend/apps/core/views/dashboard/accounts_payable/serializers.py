from rest_framework import serializers


class PayableTotalSerializer(serializers.Serializer[dict[str, object]]):
    count = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)


class UpcomingPayableSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    description = serializers.CharField()
    supplier_name = serializers.CharField()
    condominium_name = serializers.CharField(
        allow_null=True, help_text="Vazio: despesa da própria administradora"
    )
    due_date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue = serializers.BooleanField()


class AccountsPayableSerializer(serializers.Serializer[dict[str, object]]):
    overdue = PayableTotalSerializer(help_text="Em aberto e vencidas")
    due_today = PayableTotalSerializer()
    due_next_7_days = PayableTotalSerializer(help_text="De amanhã até daqui a 7 dias")
    due_this_month = PayableTotalSerializer(help_text="Em aberto com vencimento no mês corrente")
    upcoming = UpcomingPayableSerializer(many=True, help_text="As mais antigas em aberto primeiro")
