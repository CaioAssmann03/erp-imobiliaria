from rest_framework import filters, viewsets

from .models import Empresa
from .serializers import EmpresaSerializer


class EmpresaViewSet(viewsets.ModelViewSet):
    """CRUD de Empresa (administradora) — base do modelo multiempresa."""

    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["razao_social", "nome_fantasia", "cnpj"]
