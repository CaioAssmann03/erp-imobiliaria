from rest_framework.routers import DefaultRouter

from .views import (
    AccountPayableViewSet,
    BankAccountViewSet,
    CostCenterViewSet,
    EntryTemplateViewSet,
    SupplierViewSet,
)

router = DefaultRouter()
router.register("cost-centers", CostCenterViewSet, basename="cost-center")
router.register("entry-templates", EntryTemplateViewSet, basename="entry-template")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("bank-accounts", BankAccountViewSet, basename="bank-account")
router.register("accounts-payable", AccountPayableViewSet, basename="account-payable")

urlpatterns = router.urls
