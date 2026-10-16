from rest_framework.routers import DefaultRouter

from .views import (
    BlockViewSet,
    CondominiumViewSet,
    LateInterestRateViewSet,
    UnitPersonViewSet,
    UnitViewSet,
)

router = DefaultRouter()
router.register("condominiums", CondominiumViewSet, basename="condominium")
router.register("blocks", BlockViewSet, basename="block")
router.register("units", UnitViewSet, basename="unit")
router.register("unit-people", UnitPersonViewSet, basename="unit-person")
router.register("late-interest-rates", LateInterestRateViewSet, basename="late-interest-rate")

urlpatterns = router.urls
