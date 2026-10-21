from rest_framework.routers import DefaultRouter

from .views import BillingDocumentViewSet, BillingPlanViewSet, BillingRunViewSet

router = DefaultRouter()
router.register("billing-plans", BillingPlanViewSet, basename="billing-plan")
router.register("billing-documents", BillingDocumentViewSet, basename="billing-document")
router.register("billing-runs", BillingRunViewSet, basename="billing-run")

urlpatterns = router.urls
