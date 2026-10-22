from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AsaasWebhookView, ResendWebhookView, BillingDocumentViewSet, BillingPlanViewSet, BillingRunViewSet

router = DefaultRouter()
router.register("billing-plans", BillingPlanViewSet, basename="billing-plan")
router.register("billing-documents", BillingDocumentViewSet, basename="billing-document")
router.register("billing-runs", BillingRunViewSet, basename="billing-run")

urlpatterns = [
    path("webhooks/asaas/", AsaasWebhookView.as_view(), name="asaas-webhook"),
    path("webhooks/resend/", ResendWebhookView.as_view(), name="resend-webhook"),
    *router.urls,
]
