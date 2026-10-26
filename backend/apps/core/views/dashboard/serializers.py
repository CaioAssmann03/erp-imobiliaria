from rest_framework import serializers

from .accounts_payable.serializers import AccountsPayableSerializer
from .adjustments.serializers import (
    AdjustmentByMonthSerializer,
    UpcomingAdjustmentSerializer,
)
from .fixed_revenue.serializers import FixedRevenueSerializer
from .leases.serializers import LeaseSerializer
from .pending.serializers import PendingItemsSerializer
from .registrations.serializers import SummarySerializer
from .responsibles.serializers import ResponsiblesSerializer


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
