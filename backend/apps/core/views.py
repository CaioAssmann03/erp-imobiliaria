from rest_framework import viewsets

from apps.core.filters import QuerySearchFilter

from .models import Empresa
from .serializers import EmpresaSerializer


class EmpresaViewSet(viewsets.ModelViewSet):
    """CRUD de Empresa (administradora) — base do modelo multiempresa."""

    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    filter_backends = [QuerySearchFilter]
    search_fields = ["razao_social", "nome_fantasia", "cnpj"]
