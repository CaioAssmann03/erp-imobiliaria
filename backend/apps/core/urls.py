from django.urls import path
from rest_framework.routers import DefaultRouter

from .dashboard import DashboardView
from .search import BuscaView
from .views import EmpresaViewSet

router = DefaultRouter()
router.register("empresas", EmpresaViewSet, basename="empresa")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("busca/", BuscaView.as_view(), name="busca"),
    *router.urls,
]
