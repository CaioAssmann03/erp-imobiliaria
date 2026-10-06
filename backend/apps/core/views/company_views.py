from rest_framework import viewsets
from rest_framework.permissions import BasePermission, IsAuthenticated
from typing_extensions import final, override

from apps.core.filters import QuerySearchFilter
from apps.core.permissions import IsSuperuser
from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import Company
from ..serializers import CompanySerializer


@final
class CompanyViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Company]):
    """Company (administradora): staff sees and edits only their own; creating or deleting is superuser-only."""

    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = (QuerySearchFilter,)
    search_fields = ("legal_name", "trade_name", "cnpj")

    @override
    def get_permissions(self) -> list[BasePermission]:
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperuser()]
        return [IsAuthenticated()]
