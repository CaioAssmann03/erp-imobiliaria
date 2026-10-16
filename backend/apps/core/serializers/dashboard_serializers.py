from rest_framework import serializers


class TotalByTypeSerializer(serializers.Serializer[dict[str, object]]):
    type = serializers.CharField()
    title = serializers.CharField()
    total = serializers.IntegerField()


class SummarySerializer(serializers.Serializer[dict[str, object]]):
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    by_type = TotalByTypeSerializer(many=True)


class ResponsiblesSerializer(serializers.Serializer[dict[str, object]]):
    active_units = serializers.IntegerField()
    with_responsible = serializers.IntegerField(
        help_text="Unidades ativas com proprietário/locatário vigente"
    )


class AdjustmentByMonthSerializer(serializers.Serializer[dict[str, object]]):
    month = serializers.CharField(help_text='"overdue" ou AAAA-MM')
    total = serializers.IntegerField()


class UpcomingAdjustmentSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    date = serializers.DateField()
    adjustment_index = serializers.CharField(allow_blank=True)
    overdue = serializers.BooleanField()


class CondominiumFeeSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class FixedRevenueSerializer(serializers.Serializer[dict[str, object]]):
    monthly_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    fixed_condominiums = serializers.IntegerField()
    variable_condominiums = serializers.IntegerField(
        help_text="Taxa em %: dependem do financeiro"
    )
    largest = CondominiumFeeSerializer(many=True)


class LeaseSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField(help_text="ID da unidade")
    condominium = serializers.UUIDField()
    condominium_name = serializers.CharField()
    unit = serializers.CharField()
    tenant = serializers.CharField()
    end_date = serializers.DateField()
    ended = serializers.BooleanField()


class PendingItemsSerializer(serializers.Serializer[dict[str, object]]):
    units_without_responsible = serializers.IntegerField(
        help_text="Unidades ativas sem proprietário/locatário: não há a quem cobrar"
    )
    inconsistent_apportionment = serializers.IntegerField(
        help_text="Condomínios ativos cuja soma de alguma fração ideal em uso não fecha 1"
    )
    overdue_adjustments = serializers.IntegerField()
    adjustments_next_30_days = serializers.IntegerField()
    leases_ending = serializers.IntegerField()
    without_cost_centers = serializers.IntegerField(
        help_text="Condomínios ativos sem centros de custo"
    )
    billing_blocked_units = serializers.IntegerField()


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


class DashboardSerializer(serializers.Serializer[dict[str, object]]):
    condominiums = SummarySerializer()
    units = SummarySerializer()
    persons = SummarySerializer()
    responsibles = ResponsiblesSerializer()
    adjustments_by_month = AdjustmentByMonthSerializer(many=True)
    upcoming_adjustments = UpcomingAdjustmentSerializer(many=True)
    fixed_revenue = FixedRevenueSerializer()
    leases = LeaseSerializer(many=True)
    pending = PendingItemsSerializer()
    accounts_payable = AccountsPayableSerializer()
