from rest_framework.routers import DefaultRouter

from .views import PessoaViewSet

router = DefaultRouter()
router.register("pessoas", PessoaViewSet, basename="pessoa")

urlpatterns = router.urls
