from rest_framework.routers import DefaultRouter

from .views import (
    BlockViewSet,
    CondominiumApportionmentCriterionViewSet,
    CondominiumViewSet,
    UnitPersonViewSet,
    UnitViewSet,
)

router = DefaultRouter()
router.register("condominiums", CondominiumViewSet, basename="condominium")
router.register(
    "condominium-apportionment-criteria",
    CondominiumApportionmentCriterionViewSet,
    basename="condominium-apportionment-criterion",
)
router.register("blocks", BlockViewSet, basename="block")
router.register("units", UnitViewSet, basename="unit")
router.register("unit-people", UnitPersonViewSet, basename="unit-person")

urlpatterns = router.urls
