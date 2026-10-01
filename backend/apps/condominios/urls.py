from rest_framework.routers import DefaultRouter

from .views import (
    BlocoViewSet,
    CondominioViewSet,
    HistoricoViewSet,
    SubContaViewSet,
    UnidadeParteViewSet,
    UnidadeViewSet,
)

router = DefaultRouter()
router.register("condominios", CondominioViewSet, basename="condominio")
router.register("blocos", BlocoViewSet, basename="bloco")
router.register("unidades", UnidadeViewSet, basename="unidade")
router.register("unidade-partes", UnidadeParteViewSet, basename="unidade-parte")
router.register("subcontas", SubContaViewSet, basename="subconta")
router.register("historicos", HistoricoViewSet, basename="historico")

urlpatterns = router.urls
