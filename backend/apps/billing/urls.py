from rest_framework.routers import DefaultRouter

from .views import BillingPlanViewSet

router = DefaultRouter()
router.register("billing-plans", BillingPlanViewSet, basename="billing-plan")

urlpatterns = router.urls
