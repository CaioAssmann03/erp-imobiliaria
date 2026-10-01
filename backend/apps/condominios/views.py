from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.filters import QuerySearchFilter

from .models import Bloco, Condominio, Historico, SubConta, Unidade, UnidadeParte
from .serializers import (
    BlocoSerializer,
    CondominioSerializer,
    HistoricoSerializer,
    SubContaSerializer,
    UnidadeParteSerializer,
    UnidadeSerializer,
)


class CondominioViewSet(viewsets.ModelViewSet):
    queryset = Condominio.objects.select_related("empresa", "assessor").all()
    serializer_class = CondominioSerializer
    filter_backends = [DjangoFilterBackend, QuerySearchFilter]
    search_fields = ["nome", "cnpj"]
    filterset_fields = ["empresa", "ativo", "tipo", "uf"]


class BlocoViewSet(viewsets.ModelViewSet):
    queryset = Bloco.objects.all()
    serializer_class = BlocoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["condominio"]


class UnidadeViewSet(viewsets.ModelViewSet):
    queryset = Unidade.objects.select_related("condominio", "bloco").prefetch_related("partes__pessoa").all()
    serializer_class = UnidadeSerializer
    filter_backends = [DjangoFilterBackend, QuerySearchFilter]
    search_fields = ["nome_unidade"]
    filterset_fields = ["condominio", "bloco", "ativo", "tipo"]


class UnidadeParteViewSet(viewsets.ModelViewSet):
    queryset = UnidadeParte.objects.select_related("unidade", "pessoa").all()
    serializer_class = UnidadeParteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["unidade", "pessoa", "papel"]


class SubContaViewSet(viewsets.ModelViewSet):
    queryset = SubConta.objects.all()
    serializer_class = SubContaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["condominio"]


class HistoricoViewSet(viewsets.ModelViewSet):
    queryset = Historico.objects.select_related("subconta").all()
    serializer_class = HistoricoSerializer
    filter_backends = [DjangoFilterBackend, QuerySearchFilter]
    search_fields = ["nome"]
    filterset_fields = ["subconta", "ativo"]
